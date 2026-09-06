package com.l3mon.vulnscanner;

import android.app.Activity;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.PermissionInfo;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.TextView;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Local, read-only configuration scanner with real-time backend integration.
 * It does not exploit applications, inspect their private data, or compromise
 * confidentiality beyond reading publicly-available package metadata.
 */
public class MainActivity extends Activity {
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private LinearLayout results;
    private TextView status;
    private ProgressBar progress;
    private Button scanButton;
    private TextView connectionStatus;
    private SocketClient socketClient;
    private DeviceManager deviceManager;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(createScreen());
        deviceManager = new DeviceManager(this);
        setupSocketClient();
    }

    private void setupSocketClient() {
        socketClient = new SocketClient();
        socketClient.addListener(new SocketClient.ConnectionListener() {
            @Override
            public void onConnected() {
                registerDevice();
            }

            @Override
            public void onDisconnected() {
                mainHandler.post(() -> {
                    connectionStatus.setText("Offline");
                    connectionStatus.setBackgroundColor(Color.rgb(231, 76, 60));
                });
            }

            @Override
            public void onConnectError(Exception e) {
                mainHandler.post(() -> {
                    connectionStatus.setText("Connection error");
                    connectionStatus.setBackgroundColor(Color.rgb(231, 76, 60));
                });
            }

            @Override
            public void onScanConfirmed() {
                mainHandler.post(() -> status.setText("Results sent to dashboard."));
            }
        });
        socketClient.connect();
    }

    private void registerDevice() {
        try {
            JSONObject deviceObj = deviceManager.toJson();
            socketClient.registerDevice(deviceObj, null);
            mainHandler.post(() -> {
                connectionStatus.setText("Live");
                connectionStatus.setBackgroundColor(Color.rgb(39, 174, 95));
            });
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    private View createScreen() {
        int pad = dp(18);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(pad, pad, pad, pad);
        root.setBackgroundColor(Color.rgb(250, 250, 250));

        LinearLayout header = new LinearLayout(this);
        header.setOrientation(LinearLayout.HORIZONTAL);
        header.setGravity(Gravity.END);
        connectionStatus = new TextView(this);
        connectionStatus.setText("Connecting…");
        connectionStatus.setTextColor(Color.WHITE);
        connectionStatus.setPadding(dp(8), dp(4), dp(8), dp(4));
        connectionStatus.setBackgroundColor(Color.rgb(158, 158, 158));
        connectionStatus.setGravity(Gravity.CENTER);
        header.addView(connectionStatus, new LinearLayout.LayoutParams(-2, -2));
        root.addView(header, new LinearLayout.LayoutParams(-1, -2));

        TextView title = text("L3MON Vulnerability Scanner", 24, Color.rgb(19, 115, 51));
        root.addView(title);
        TextView privacy = text("Read-only, on-device assessment. Results are heuristic indicators—not proof of a vulnerability. Scan only devices and apps you are authorized to assess.", 14, Color.DKGRAY);
        privacy.setPadding(0, dp(8), 0, dp(10));
        root.addView(privacy);

        scanButton = new Button(this);
        scanButton.setText("Scan installed apps");
        scanButton.setAllCaps(false);
        scanButton.setOnClickListener(v -> scanInstalledApps());
        root.addView(scanButton, new LinearLayout.LayoutParams(-1, -2));

        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progress.setVisibility(View.GONE);
        progress.setPadding(0, dp(10), 0, 0);
        root.addView(progress, new LinearLayout.LayoutParams(-1, -2));

        status = text("Ready to assess visible installed applications.", 15, Color.DKGRAY);
        status.setPadding(0, dp(12), 0, dp(8));
        root.addView(status);

        ScrollView scroll = new ScrollView(this);
        results = new LinearLayout(this);
        results.setOrientation(LinearLayout.VERTICAL);
        scroll.addView(results);
        root.addView(scroll, new LinearLayout.LayoutParams(-1, 0, 1));
        return root;
    }

    private void scanInstalledApps() {
        scanButton.setEnabled(false);
        progress.setVisibility(View.VISIBLE);
        progress.setIndeterminate(true);
        results.removeAllViews();
        status.setText("Reading package metadata locally…");
        executor.execute(() -> {
            List<Finding> findings = inspectPackages();
            mainHandler.post(() -> showFindings(findings));
        });
    }

    @SuppressWarnings("deprecation")
    private List<Finding> inspectPackages() {
        PackageManager pm = getPackageManager();
        List<ApplicationInfo> apps = pm.getInstalledApplications(PackageManager.GET_META_DATA);
        List<Finding> findings = new ArrayList<>();
        for (ApplicationInfo app : apps) {
            List<String> signals = new ArrayList<>();
            int score = 0;
            if ((app.flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
                signals.add("Debuggable build enabled"); score += 3;
            }
            if ((app.flags & ApplicationInfo.FLAG_ALLOW_BACKUP) != 0) {
                signals.add("App data backup allowed"); score += 2;
            }
            if ((app.flags & ApplicationInfo.FLAG_USES_CLEARTEXT_TRAFFIC) != 0) {
                signals.add("Cleartext network traffic allowed"); score += 3;
            }
            try {
                PackageInfo pkg = pm.getPackageInfo(app.packageName, PackageManager.GET_PERMISSIONS);
                if (pkg.applicationInfo.targetSdkVersion < 26) {
                    signals.add("Targets Android " + pkg.applicationInfo.targetSdkVersion + " (legacy security model)"); score += 2;
                }
                int dangerous = countDangerousPermissions(pm, pkg.requestedPermissions);
                if (dangerous >= 6) {
                    signals.add(dangerous + " dangerous permissions requested"); score += 2;
                }
            } catch (PackageManager.NameNotFoundException ignored) {
                // An app can be removed while the inventory is being processed.
            }
            if (!signals.isEmpty()) {
                CharSequence label = app.loadLabel(pm);
                findings.add(new Finding(label == null ? app.packageName : label.toString(), app.packageName, score, signals));
            }
        }
        Collections.sort(findings, Comparator.comparingInt((Finding item) -> item.score).reversed());
        return findings;
    }

    @SuppressWarnings("deprecation")
    private int countDangerousPermissions(PackageManager pm, String[] permissions) {
        if (permissions == null) return 0;
        int count = 0;
        for (String permission : permissions) {
            try {
                PermissionInfo info = pm.getPermissionInfo(permission, 0);
                if ((info.protectionLevel & PermissionInfo.PROTECTION_MASK_BASE) == PermissionInfo.PROTECTION_DANGEROUS) count++;
            } catch (PackageManager.NameNotFoundException ignored) { }
        }
        return count;
    }

    private void showFindings(List<Finding> findings) {
        progress.setVisibility(View.GONE);
        scanButton.setEnabled(true);
        status.setText("Completed: " + findings.size() + " app(s) need review. Tap Scan to refresh.");
        if (findings.isEmpty()) {
            results.addView(text("No heuristic indicators found among apps visible to this scanner.", 16, Color.rgb(19, 115, 51)));
            return;
        }
        for (Finding finding : findings) addFindingCard(finding);

        if (socketClient != null && socketClient.isConnected()) {
            sendScanResults(findings);
        }
    }

    private void sendScanResults(List<Finding> findings) {
        try {
            int totalApps = getPackageManager().getInstalledApplications(0).size();
            JSONObject payload = deviceManager.findingsToJson(findings, totalApps);
            socketClient.sendScanResults(payload);
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    private void addFindingCard(Finding finding) {
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setPadding(dp(14), dp(12), dp(14), dp(12));
        card.setBackgroundColor(Color.WHITE);
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(-1, -2);
        params.setMargins(0, dp(5), 0, dp(5));
        results.addView(card, params);
        int color = finding.score >= 5 ? Color.rgb(179, 38, 30) : Color.rgb(154, 103, 0);
        card.addView(text(severity(finding.score) + "  " + finding.label, 17, color));
        card.addView(text(finding.packageName, 12, Color.GRAY));
        for (String signal : finding.signals) card.addView(text("• " + signal, 14, Color.DKGRAY));
        card.addView(text("Review the app's manifest, update it, and confirm this setting is intentional.", 13, Color.GRAY));
    }

    private String severity(int score) { return score >= 5 ? "HIGH" : "REVIEW"; }
    private TextView text(String value, int size, int color) {
        TextView text = new TextView(this); text.setText(value); text.setTextSize(size); text.setTextColor(color);
        text.setGravity(Gravity.START); text.setLineSpacing(dp(2), 1f); return text;
    }
    private int dp(int value) { return Math.round(value * getResources().getDisplayMetrics().density); }
    @Override public void onDestroy() {
        if (socketClient != null) socketClient.disconnect();
        executor.shutdownNow();
        super.onDestroy();
    }
}
