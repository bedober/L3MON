# L3MON Vulnerability Scanner

A small Android app that performs a **read-only, local configuration review** of installed apps. It inventories package metadata and flags indicators worth reviewing:

- Debuggable release configuration
- Enabled Android data backup
- Permitted cleartext network traffic
- Legacy target SDK level
- Large sets of dangerous runtime permissions

This is a defensive heuristic scanner, not an exploitation tool and not proof that an app is vulnerable. Use it only on devices and apps that you own or are explicitly authorized to assess. It neither reads other apps' private files nor uploads results.

## Build

Use Android Studio (JDK 17) to open the repository and run the `app` configuration, or execute:

```bash
./gradlew assembleDebug
```

The project uses Android Gradle Plugin 8.6.1, `compileSdk` 35, and has a minimum SDK of 23. Android 11+ requires package visibility access to provide a complete installed-app inventory. The manifest requests `QUERY_ALL_PACKAGES`; apps distributed through Google Play must meet that permission's policy requirements.

## Interpreting results

Findings should initiate verification: inspect the app manifest, current release configuration, and threat model. For example, backup may be correct for a consumer app with encrypted backups, and a dangerous permission may be necessary for its core feature.
