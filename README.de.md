# 🚀 URL Webhook Clipper – Die beste Webhook Chrome-Erweiterung
## 🌟 Automatisiere deine Workflows mit Webhooks in nur einem Klick!

**URL Webhook Clipper** ist eine leistungsstarke **Webhook Chrome-Erweiterung**, mit der du **URLs, Notizen und Dateien direkt an mehrere Webhook-Endpunkte senden kannst**.
Perfekt für die Automatisierung von Workflows mit **Make.com, Zapier, N8N, Slack, ClickUp, Notion, Airtable, Google Sheets und CRM-Tools** wie **HubSpot, Pipedrive und Salesforce**.

## Neu in Version 1.7
- 🎉 **Komplette modulare Architektur**: Saubere, wartbare Code-Struktur
- ✅ **Session-basierte Persistenz**: Formulardaten bleiben während der Browser-Session erhalten
- ✅ **Auto-Save Funktion**: Automatisches Speichern mit 500ms Debounce
- ✅ **Clear Form Button**: Manueller Reset für Formulardaten
- ✅ **Verbesserte Code-Organisation**: 6 spezialisierte Module
- ✅ **Bessere Entwickler-Erfahrung**: Höhere Wartbarkeit und Erweiterbarkeit

## Vorherige Versionen

### Version 1.6
- **CORS Fix**: Cross-Origin Resource Sharing (CORS) Fehler behoben für reibungslosere Webhook-Anfragen.
- **Webhook Response Handling**: Die Antwort von Make.com wird jetzt im Notizenfeld angezeigt, was die Anbindung von AI Agents ermöglicht.
- **Template-Beschreibung**: Du kannst jetzt eine Beschreibung für jedes Template hinzufügen, um die Funktionalität besser zu verstehen.
- **Layout-Änderungen**: Der Dark-Mode-Toggle, die Überschrift und das Schließen-Symbol sind jetzt in einer Zeile angeordnet, um Platz zu sparen.

## Video Tutorial
[![URL Webhook Clipper Tutorial](https://img.youtube.com/vi/Cwjrm6HHJ-s/0.jpg)](https://www.youtube.com/watch?v=Cwjrm6HHJ-s)

🔹 **Leads erfassen, URLs speichern & Webhooks nahtlos automatisieren!**

---

## 🔥 Hauptfunktionen dieser Webhook Chrome-Erweiterung

- ✔ **URLs sofort senden** – Teile die aktuelle Tab-URL mit jedem Webhook.
- ✔ **Unterstützung mehrerer Webhooks** – Sende Daten gleichzeitig an mehrere Endpunkte.
- ✔ **KI & No-Code-Automatisierung** – Verbindung mit **Make.com, N8N und Zapier**.
- ✔ **Lead-Erfassung in CRM** – Leads direkt in **HubSpot, Pipedrive oder Salesforce** speichern.
- ✔ **Aufgabenerstellung in ClickUp, Slack & Trello** – URLs in Aufgaben umwandeln.
- ✔ **Dateien per Drag & Drop anhängen** – Direkt aus dem Chrome-Download-Popup hochladen.
- ✔ **Persistentes Popup & Dark Mode** – Verbesserte Benutzererfahrung & Theme-Anpassung.
- ✔ **Session-Persistenz (NEU in v1.7)** – Formulardaten bleiben während der Browser-Session erhalten.
- ✔ **Auto-Save (NEU in v1.7)** – Automatisches Speichern beim Tippen.
- ✔ **Clear Form Button (NEU in v1.7)** – Schnelles Zurücksetzen aller Felder.
- ✔ **Sichere & DSGVO-konforme Speicherung** – Webhook-Konfigurationen werden lokal gespeichert.
- ✔ **Webhooks importieren & exportieren** – Einfache Übertragung der Einstellungen zwischen Geräten.
- ✔ **Rechnungsautomatisierung** – Rechnungen & Belege an **DATEV, QuickBooks oder Google Drive** senden.
- ✔ **Telefonnummer direkt an Smartphone senden** – Wähle eine Telefonnummer aus und sende sie an dein Smartphone.

✅ **Spare Zeit, automatisiere wiederkehrende Aufgaben und optimiere deinen Workflow noch heute!**

---

## 📥 Installation & Einrichtung

### **Installation aus dem Chrome Web Store**
👉 [chromewebstore.google.com/detail/url-webhook-clipper/akgfjejofhfldfhijdmndomkcimfngac](https://chromewebstore.google.com/detail/url-webhook-clipper/akgfjejofhfldfhijdmndomkcimfngac)

### **Manuelle Installation**
1. Lade dieses Repository herunter oder klone es.
2. Öffne `chrome://extensions/` in Chrome.
3. Aktiviere **Entwicklermodus** (oben rechts).
4. Klicke auf **Entpackt laden** und wähle den Erweiterungsordner aus.

---

## 🎯 So funktioniert es – Webhooks in 3 Schritten automatisieren

1. **Klicke auf das Erweiterungssymbol** in deiner Chrome-Symbolleiste.
2. **Wähle dein Webhook-Ziel** (z. B. **Make.com, N8N, Slack, ClickUp**).
3. **Sende deine Daten** – URLs, Notizen, Dateien und mehr!

📌 **Perfekt für Lead-Erfassung, Aufgabenautomatisierung und KI-gestützte Workflows.**

---

## 🆕 Session-Persistenz (Version 1.7)

### Wie funktioniert die neue Persistenz?

- **Auto-Save**: Formulardaten werden automatisch beim Tippen gespeichert (500ms Verzögerung)
- **Persistente Felder**: Notizen, Webhook-Auswahl, Template-Auswahl und Dateianhänge
- **Session-Only**: Daten bleiben nur während der Browser-Session erhalten (werden beim Browser-Neustart gelöscht)
- **Auto-Clear**: Daten werden automatisch nach erfolgreichem Senden oder bei Fehlern gelöscht
- **Manuelles Löschen**: Nutze den "Clear Form" Button zum schnellen Zurücksetzen
- **Dynamische URL**: Die aktuelle Tab-URL wird immer frisch beim Senden abgerufen (nie gespeichert)

---

## 🔧 Webhook Payload & JSON-Format

Die Erweiterung sendet Daten im folgenden JSON-Format:

```json
{
  "url": "https://example.com",
  "title": "Beispiel-Seitentitel",
  "notes": "Benutzer eingegebene Notizen",
  "template": "Lead-Erfassung",
  "metaDescription": "Meta-Beschreibung der Seite",
  "timestamp": "2024-03-13T20:00:00.000Z",
  "attachments": [
    {
      "name": "dokument.pdf",
      "type": "application/pdf",
      "data": "base64-encoded-content"
    }
  ]
}
```

## 📌 Anwendungsfälle

- 🔹 **Website-Leads erfassen** und an **HubSpot, Pipedrive oder Salesforce** senden.
- 🔹 **KI-gestützte Aufgabenautomatisierung** in **ClickUp, Slack oder Trello**.
- 🔹 **Rechnungen & Dokumente automatisch senden** an **DATEV, QuickBooks oder Google Drive**.
- 🔹 **Forschungslinks automatisch speichern** in **Notion, Airtable oder Google Sheets**.
- 🔹 **Telefonnummern direkt an dein Smartphone senden** – Wähle eine Telefonnummer aus und sende sie an dein Smartphone.

---

## 🏗️ Modulare Architektur (Version 1.7)

### Dateistruktur

```
URL-Webhook-Clipper/
├── manifest.json           # Extension manifest (v1.7)
├── background.js          # Background service worker
├── popup/
│   ├── popup.html        # Haupt-UI
│   ├── popup.js          # Haupt-Orchestrierung
│   ├── styles.css        # Alle Styles
│   └── modules/          # Modulare Architektur (NEU in v1.7)
│       ├── storage.js    # Session Storage Management
│       ├── theme.js      # Dark Mode Handling
│       ├── fileHandler.js # Datei-Anhang Logik
│       ├── sender.js     # Webhook-Versand Logik
│       └── webhookManager.js # Webhook CRUD Operationen
└── icons/
```

### Module im Detail

- **storage.js**: Session Storage Operationen
  - Formulardaten speichern/laden/löschen
  - Aktuellen Formular-Status abrufen
  - Formular-Status in UI wiederherstellen

- **theme.js**: Dark Mode Management
  - Theme basierend auf Präferenz initialisieren
  - Theme umschalten
  - Theme-Icons aktualisieren

- **fileHandler.js**: Datei-Anhänge verarbeiten
  - Drag & Drop Handling
  - Datei-Validierung
  - Anhang-Management

- **sender.js**: Daten an Webhooks senden
  - Aktuelle Tab-Info abrufen
  - Payload vorbereiten
  - Webhook-Antworten verarbeiten

- **webhookManager.js**: Webhook-Konfigurationen verwalten
  - CRUD-Operationen für Webhooks
  - Template-Management
  - Import/Export-Funktionalität

---

## 🔒 Datenschutz & DSGVO-Konformität

- ✅ **Keine Tracking-Tools, keine Analyse-Daten** – 100 % datenschutzfreundlich.
- ✅ **Alle Daten bleiben lokal gespeichert** – Webhook-Einstellungen verlassen niemals deinen Browser.
- ✅ **Session-Only Persistenz** – Formulardaten werden nur während der Browser-Session gespeichert.
- ✅ **Nur Daten senden, die du explizit auswählst** – Volle Kontrolle über deine Daten.

### 📌 So löschst du gespeicherte Daten

1. **Formulardaten löschen**: Nutze den "Clear Form" Button
2. **Webhook-Konfigurationen entfernen**: Lösche Webhooks in den Einstellungen
3. **Browser-Speicher löschen**: Chrome-Einstellungen → Datenschutz → Browserdaten löschen
4. **Erweiterung deinstallieren**: Entfernt alle gespeicherten Daten

---

## 🛠 Entwicklung & Beiträge

Möchtest du **URL Webhook Clipper** verbessern? Sei dabei!

- 📩 **Fehlermeldungen & Funktionsvorschläge:** [github.com/chris86tian/URL-Webhook-Clipper/issues](https://github.com/chris86tian/URL-Webhook-Clipper/issues)
- 🤝 **Contribute & Pull Requests einreichen:** [github.com/chris86tian/URL-Webhook-Clipper](https://github.com/chris86tian/URL-Webhook-Clipper)

---

## 📌 Changelog

### **v1.7** (Aktuell)
- 🎉 Komplette modulare Refaktorierung
- ✅ Session-basierte Persistenz implementiert
- ✅ Auto-Save mit Debouncing
- ✅ Clear Form Button hinzugefügt
- ✅ Verbesserte Code-Organisation
- ✅ Erhöhte Wartbarkeit

### **v1.6**
- ✅ CORS Fix für Webhook-Anfragen
- ✅ Webhook-Antwort im Notizenfeld
- ✅ Template-Beschreibungen
- ✅ Layout-Verbesserungen

### **v1.5**
- 🚀 Webhook Response Handling für AI Agents
- ✅ Template-Beschreibung hinzugefügt
- ✅ Layout-Änderungen für bessere UX

### **v1.4**
- 🚀 Telefonnummer direkt an Smartphone senden

### **v1.3**
- ✅ Verbesserte Lesbarkeit im Dark Mode
- ✅ Webhook-Einstellungen importieren/exportieren
- ✅ Optimierte Lead-Erfassung

### **v1.2**
- ✅ Persistentes Popup-Fenster
- ✅ Drag & Drop für Dateien
- ✅ DSGVO-Konformität

---

## 👤 Über den Entwickler – Christian Götz

👋 **Experte für KI & Workflow-Automatisierung**

### 📢 **Boost Your Business Community (Kostenlose AI & Automatisierungsgruppe)**
➡ [skool.com/boostyourbusiness/about](https://www.skool.com/boostyourbusiness/about)

### 🛠 **Benötigst du Hilfe bei AI-Automatisierungen?**
📅 **Buche ein 1:1-Gespräch:** [calendly.com/christiangoetz/60min](https://calendly.com/christiangoetz/60min)

### 🚀 **Lipa LIFE – Agentur für digitale Marketing- & KI-Automatisierung**
🌐 **Mehr erfahren:** [lipalife.de](https://lipalife.de)

### 🎤 **KI-Musik – AI-generierte Tracks auf Spotify**
🎵 **Jetzt reinhören:** [open.spotify.com/intl-de/artist/4rUKEiC2c4Cr7vVc8F7JbZ](https://open.spotify.com/intl-de/artist/4rUKEiC2c4Cr7vVc8F7JbZ)

### 📸 **Einblicke in KI & Automatisierung auf Instagram**
📷 [instagram.com/christian__goetz](https://www.instagram.com/christian__goetz/)

### ☕ **Dieses AI-Tool hilft dir? Unterstütze mich mit einem Kaffee!**
💰 [paypal.com/donate?business=chris86tian@gmail.com&currency_code=EUR](https://www.paypal.com/donate?business=chris86tian@gmail.com&currency_code=EUR)

---

## 💡 Warum URL Webhook Clipper für KI Automatisierungen nutzen?

- 🚀 **Automatisiere alles** – Von Lead-Erfassung bis Rechnungsverarbeitung.
- 🔒 **Datenschutzfreundlich** – Keine Tracking-Tools, alle Daten bleiben im Browser.
- 📎 **Unterstützt KI & CRM-Tools** – Funktioniert mit **Make.com, N8N, Zapier, Slack, ClickUp & mehr**.
- 🔄 **No-Code & KI-gestützte Automatisierung** – Perfekt für **Notion, Trello, Google Sheets und Airtable**.
- 💾 **Session-Persistenz (NEU)** – Formulardaten bleiben während der Browser-Session erhalten.

✅ **Jetzt ausprobieren & KI-Automatisierung auf das nächste Level bringen!**
👉 [chromewebstore.google.com/detail/url-webhook-clipper/akgfjejofhfldfhijdmndomkcimfngac](https://chromewebstore.google.com/detail/url-webhook-clipper/akgfjejofhfldfhijdmndomkcimfngac)
