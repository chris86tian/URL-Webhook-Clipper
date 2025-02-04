# URL Webhook Clipper

Eine Chrome-Erweiterung, mit der Sie ganz einfach URLs und benutzerdefinierte Notizen an mehrere Webhook-Endpunkte senden können. Perfekt zum Speichern von Links zu Ihren bevorzugten Diensten oder zum Erstellen von Aufgaben aus Webseiten.

[English Version (Englische Version)](README.md)

## Video Tutorial
[![URL Webhook Clipper Tutorial](https://img.youtube.com/vi/Cwjrm6HHJ-s/0.jpg)](https://www.youtube.com/watch?v=Cwjrm6HHJ-s)

## Funktionen

🔗 Senden Sie die aktuelle Tab-URL an jeden konfigurierten Webhook
📝 Fügen Sie Ihren Übermittlungen benutzerdefinierte Notizen hinzu
⚡ Unterstützung für mehrere Webhook-Endpunkte
🏷️ Anpassbare Templates für jeden Webhook
📎 Drag & Drop von Dateien direkt aus dem Chrome-Download-Popup in die Erweiterung
🌓 Dark Mode-Unterstützung mit Systemeinstellungserkennung
🔄 Permanentes Popup-Fenster für besseren Workflow
🔒 Sichere Speicherung der Webhook-Konfigurationen
🎨 Übersichtliche und intuitive Benutzeroberfläche

## Installation

### Aus dem Chrome Web Store
https://chromewebstore.google.com/detail/url-webhook-clipper/akgfjejofhfldfhijdmndomkcimfngac

### Manuelle Installation
1. Laden Sie dieses Repository herunter oder klonen Sie es
2. Öffnen Sie Chrome und navigieren Sie zu `chrome://extensions/`
3. Aktivieren Sie den "Entwicklermodus" oben rechts
4. Klicken Sie auf "Entpackte Erweiterung laden" und wählen Sie das Erweiterungsverzeichnis aus

## Verwendung

1. Klicken Sie auf das Erweiterungssymbol in Ihrer Chrome-Symbolleiste
2. Wählen Sie das gewünschte Webhook-Ziel aus dem Dropdown-Menü
3. Wählen Sie ein Template (falls konfiguriert)
4. Fügen Sie zusätzliche Notizen hinzu
5. Ziehen Sie Dateien direkt aus dem Chrome-Download-Popup oder von Ihrem Computer per Drag & Drop
6. Klicken Sie auf "An Webhook senden"

### Konfiguration

1. Klicken Sie auf das ⚙️ Symbol, um das Konfigurationspanel zu öffnen
2. Fügen Sie neue Webhooks mit der Schaltfläche "+ Neuen Webhook hinzufügen" hinzu
3. Konfigurieren Sie für jeden Webhook:
   - Label: Ein benutzerfreundlicher Name für den Webhook
   - URL: Der Webhook-Endpunkt
   - Templates: Vordefinierte Kategorien oder Typen für Ihre Übermittlungen

## Webhook Payload Format

Die Erweiterung sendet Daten im folgenden JSON-Format:

```json
{
  "url": "https://example.com",
  "title": "Seitentitel",
  "notes": "Benutzereingabe Notizen",
  "template": "Ausgewähltes Template",
  "timestamp": "2024-03-13T20:00:00.000Z",
  "attachments": [
    {
      "name": "dateiname.pdf",
      "type": "application/pdf",
      "data": "base64-kodierter-inhalt"
    }
  ]
}
```

## Datenschutz (DSGVO)

Die URL Webhook Clipper Erweiterung wurde unter Berücksichtigung des Datenschutzes entwickelt und entspricht den DSGVO-Anforderungen:

### Datenerfassung und -nutzung
- Die Erweiterung sammelt nur Daten, die Sie ausdrücklich bereitstellen:
  - URLs und Titel von Webseiten, die Sie teilen möchten
  - Notizen, die Sie manuell eingeben
  - Dateien, die Sie anhängen möchten
  - Webhook-Konfigurationen, die Sie einrichten
- Alle Daten werden lokal in Ihrem Browser gespeichert
- Daten werden nur an die von Ihnen konfigurierten Webhook-Endpunkte gesendet
- Es werden keine Analysen oder Tracking durchgeführt
- Keine Daten werden an Dritte weitergegeben

### Ihre Rechte nach DSGVO
- Recht auf Auskunft: Alle Ihre Daten werden lokal in Ihrem Browser gespeichert
- Recht auf Löschung: Sie können alle Daten entfernen durch:
  - Löschen der Webhook-Konfigurationen
  - Löschen des Browser-Speichers
  - Deinstallation der Erweiterung
- Recht auf Datenübertragbarkeit: Webhook-Konfigurationen können exportiert werden
- Recht auf Information: Diese Dokumentation bietet volle Transparenz über die Datenverarbeitung

## Entwicklung

### Voraussetzungen
- Chrome Browser
- Grundlegendes Verständnis von JavaScript und Chrome-Erweiterungsentwicklung

### Projektstruktur
```
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── manifest.json
├── popup.html
├── popup.js
└── README.md
```

### Build
Kein Build-Schritt erforderlich. Die Erweiterung kann direkt im Entwicklermodus in Chrome geladen werden.

## Mitwirken

1. Forken Sie das Repository
2. Erstellen Sie einen Feature-Branch (`git checkout -b feature/TollesFunktion`)
3. Committen Sie Ihre Änderungen (`git commit -m 'Tolle Funktion hinzugefügt'`)
4. Pushen Sie zum Branch (`git push origin feature/TollesFunktion`)
5. Öffnen Sie einen Pull Request

## Support

Brauchen Sie Hilfe? Haben Sie einen Fehler gefunden? Haben Sie einen Feature-Wunsch? Besuchen Sie unser [GitHub Repository](https://github.com/chris86tian/URL-Webhook-Clipper) um:
- Probleme zu melden
- Funktionen anzufordern
- Am Projekt mitzuwirken
- Die neuesten Updates zu erhalten

## Changelog

### Version 1.2
- Permanentes Popup-Fenster hinzugefügt
- Schließen-Button (X) in der oberen rechten Ecke hinzugefügt
- Drag & Drop-Unterstützung für Dateien aus dem Chrome-Download-Popup hinzugefügt
- GitHub Support-Link hinzugefügt
- Verbesserte Sichtbarkeit von Statusmeldungen
- Verbesserte visuelle Rückmeldung beim Drag & Drop
- DSGVO-Dokumentation hinzugefügt
- Deutsche Übersetzung hinzugefügt

### Version 1.1
- Erstveröffentlichung mit grundlegender Funktionalität
- Unterstützung für mehrere Webhooks
- Template-System
- Dateianhang-Unterstützung

## Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert - siehe die [LICENSE](LICENSE) Datei für Details.

## Autor

📢 **Boost Your Business Community** – Die kostenlose deutsche Community für Business & AI:  
➡️ [Hier beitreten](https://www.skool.com/boostyourbusiness/about)  

🛠 **1:1 Zoom-Call mit Christian** – Brauchst du Hilfe mit Automatisierungen?  
📅 [Termin buchen](https://calendly.com/christiangoetz/60min)  

🚀 **Meine Agentur Lipa LIFE** – Digital Marketing & Automatisierung:  
🌐 [Website](https://lipalife.de)  

🎤 **Meine ersten deutschen AI-Songs auf Spotify** – KI trifft Musik:  
🎵 [Anhören](https://open.spotify.com/intl-de/artist/4rUKEiC2c4Cr7vVc8F7JbZ)  

📸 **Instagram** – Einblicke in mein Leben & Familie:  
📷 [@christian_ _goetz](https://www.instagram.com/christian__goetz/)  

☕ **Dieses Tool spart dir Zeit?**  
Unterstütze mich mit einem Kaffee:  
💰 [Spende via PayPal](https://www.paypal.com/donate?business=chris86tian@gmail.com&currency_code=EUR)  

## Danksagung

- Inspiriert vom Airtable Web Clipper
- Entwickelt mit vanilla JavaScript und Chrome Extension APIs
