package com.l3mon.vulnscanner;

import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.os.Build;
import android.provider.Settings;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.List;

/**
 * Collects device metadata for registration with the L3MON backend.
 */
public class DeviceManager {
    private final Context context;

    public DeviceManager(Context context) {
        this.context = context;
    }

    public String getDeviceId() {
        return Settings.Secure.getString(context.getContentResolver(), Settings.Secure.ANDROID_ID);
    }

    public String getDeviceName() {
        return Build.MODEL;
    }

    public String getManufacturer() {
        return Build.MANUFACTURER;
    }

    public String getOsVersion() {
        return Build.VERSION.RELEASE;
    }

    public int getInstalledAppsCount() {
        PackageManager pm = context.getPackageManager();
        List<ApplicationInfo> apps = pm.getInstalledApplications(0);
        return apps.size();
    }

    public JSONObject toJson() throws JSONException {
        JSONObject obj = new JSONObject();
        obj.put("id", getDeviceId());
        obj.put("name", getDeviceName());
        obj.put("model", getDeviceName());
        obj.put("manufacturer", getManufacturer());
        obj.put("osVersion", getOsVersion());
        obj.put("installedApps", getInstalledAppsCount());
        return obj;
    }

    public JSONArray findingsToJson(List<Finding> findings, int totalApps) throws JSONException {
        JSONArray results = new JSONArray();
        for (Finding finding : findings) {
            JSONObject f = new JSONObject();
            f.put("label", finding.label);
            f.put("packageName", finding.packageName);
            f.put("score", finding.score);
            JSONArray signals = new JSONArray();
            for (String signal : finding.signals) {
                signals.put(signal);
            }
            f.put("signals", signals);
            results.put(f);
        }
        JSONObject payload = new JSONObject();
        payload.put("findings", results);
        payload.put("totalApps", totalApps);
        return payload;
    }
}
