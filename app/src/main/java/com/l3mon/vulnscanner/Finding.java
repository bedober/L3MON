package com.l3mon.vulnscanner;

import java.util.List;

/**
 * Represents a single vulnerability finding from a scan.
 */
public class Finding {
    public final String label;
    public final String packageName;
    public final int score;
    public final List<String> signals;

    public Finding(String label, String packageName, int score, List<String> signals) {
        this.label = label;
        this.packageName = packageName;
        this.score = score;
        this.signals = signals;
    }
}
