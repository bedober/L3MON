package com.l3mon.vulnscanner;

import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

import io.socket.client.IO;
import io.socket.client.Socket;
import io.socket.emitter.Emitter;

import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;

/**
 * Manages the WebSocket (Socket.IO) connection to the L3MON backend.
 * Sends device registration, scan results, and telemetry updates.
 */
public class SocketClient {
    private static final String TAG = "SocketClient";
    private static final String DEFAULT_URL = "http://10.0.2.2:3001";

    private Socket socket;
    private boolean connected = false;
    private boolean autoReconnect = true;
    private final List<ConnectionListener> listeners = new ArrayList<>();

    public interface ConnectionListener {
        void onConnected();
        void onDisconnected();
        void onConnectError(Exception e);
        void onScanConfirmed();
    }

    public SocketClient(String serverUrl) {
        try {
            IO.Options options = new IO.Options();
            options.reconnection = true;
            options.reconnectionAttempts = 999999;
            options.reconnectionDelay = 3000;
            socket = IO.socket(serverUrl, options);
        } catch (URISyntaxException e) {
            Log.e(TAG, "Failed to create socket to " + serverUrl, e);
            socket = null;
        }
    }

    public SocketClient() {
        this(DEFAULT_URL);
    }

    public void setServerUrl(String url) {
        if (socket != null) {
            socket.disconnect();
        }
        try {
            IO.Options options = new IO.Options();
            options.reconnection = true;
            options.reconnectionAttempts = 999999;
            options.reconnectionDelay = 3000;
            socket = IO.socket(url, options);
            setupListeners();
        } catch (URISyntaxException e) {
            Log.e(TAG, "Failed to set server URL: " + url, e);
        }
    }

    public void connect() {
        if (socket == null) return;
        setupListeners();
        socket.connect();
    }

    private void setupListeners() {
        if (socket == null) return;

        socket.on(Socket.EVENT_CONNECT, new Emitter.Listener() {
            @Override
            public void call(Object... args) {
                connected = true;
                for (ConnectionListener l : listeners) l.onConnected();
            }
        });

        socket.on(Socket.EVENT_DISCONNECT, new Emitter.Listener() {
            @Override
            public void call(Object... args) {
                connected = false;
                for (ConnectionListener l : listeners) l.onDisconnected();
            }
        });

        socket.on(Socket.EVENT_CONNECT_ERROR, new Emitter.Listener() {
            @Override
            public void call(Object... args) {
                Exception e = args.length > 0 && args[0] instanceof Exception
                        ? (Exception) args[0] : new Exception("Connection error");
                Log.e(TAG, "Connect error", e);
                connected = false;
                for (ConnectionListener l : listeners) l.onConnectError(e);
            }
        });

        socket.on("register-ack", new Emitter.Listener() {
            @Override
            public void call(Object... args) {
                Log.d(TAG, "Registration acknowledged");
            }
        });
    }

    public void registerDevice(JSONObject deviceInfo, String locationIp) {
        if (socket == null) return;
        try {
            JSONObject payload = new JSONObject();
            payload.put("deviceInfo", deviceInfo);
            payload.put("locationIp", locationIp);
            socket.emit("register", payload);
        } catch (JSONException e) {
            Log.e(TAG, "Failed to build register payload", e);
        }
    }

    public void sendScanResults(JSONObject results) {
        if (socket == null) return;
        socket.emit("scan-results", results);
        for (ConnectionListener l : listeners) l.onScanConfirmed();
    }

    public void sendTelemetry(int batteryLevel) {
        if (socket == null) return;
        try {
            JSONObject telemetry = new JSONObject();
            telemetry.put("batteryLevel", batteryLevel);
            socket.emit("telemetry", telemetry);
        } catch (JSONException e) {
            Log.e(TAG, "Failed to build telemetry payload", e);
        }
    }

    public void addListener(ConnectionListener listener) {
        if (!listeners.contains(listener)) {
            listeners.add(listener);
        }
    }

    public void removeListener(ConnectionListener listener) {
        listeners.remove(listener);
    }

    public void disconnect() {
        autoReconnect = false;
        if (socket != null) {
            socket.disconnect();
        }
    }

    public boolean isConnected() {
        return connected && socket != null;
    }
}
