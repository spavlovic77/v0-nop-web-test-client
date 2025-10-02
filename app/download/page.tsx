"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, FileText, Info, Copy, Check, ArrowLeft, BookOpen } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

const SAMPLE_XML_FILE = `<?xml version="1.0" encoding="UTF-8"?>
<eu:AuthData xmlns:eu="http://financnasprava.sk/ekasa/udaje/schema/v2">
   <eu:KeyStoreType>PKCS12</eu:KeyStoreType>
   <eu:Data>MIIMgAIBAzCCDDoGCSqGSIb3DQEHAaCCDCsEggwnMIIMIzCCBYAGCSqGSIb3DQEHAaCCBXEEggVtMIIFaTCCBWUGCyqGSIb3DQEMCgECoIIE+jCCBPYwKAYKKoZIhvcNAQwBAzAaBBReDaG71hdgltXaj5UIbei0YPrzhAICBAAEggTI1RCFJ/xOfJ6LvQxOcAkUecu9Ykny6bXohOceOWpCeVDKJxiJh9VscaJ2ivkbuCDUPiGACfHBHXxEG2ZK5CJkElqyYXpQbjEaV3pY/d0u6DnTchHaS8tamZTsJmY18Ab5cHHY8lK7V6yhhVpg66SAgo2u9xEZG3aewewglXvguPoVXIG0IvJfIVSbW//b03p1MxqDmjPb2XDYrzEQskGdrfV6DZazFWP2OHTFNCrN6M6lElJUEPnGu/jgWFKhGGCWGChTK78yEIJKy+hshbRjmlmTwtKmfYp3lUxAJw6C8FMsYM0ioiGdU1fzUdbWrdChXDag0XNIMSFmlytyjR8v20QuosLFqqcgM2i6Zxuwb6XBjbN514io030JeGvSo8RaeFKA9zs0iT44rP0ussj8CC1dsa/BaBpa1itiWCF4SzIzS/c7e6gxErHtEtWtmbnhPAZFta1zhs8hvN8sgJQ9nZPuwGvDUKxXb/2Y7NYCwWvQzBtt4HYwgnpxYDJEzo1K4TByCDgX4Di3UGDTG81LPnc8wA6Ogr3o3necWBhJ4NIiBUcxpBUpTw1YKEiPRzLsyZ4ebaxf2OOCxU3ypR02sH7ZF9aMR426gtktjV/8uQhlWpAcauAJtmPhu/xP/QA66KbIFnxHjmIZhyxqTmdetBBr7YURyuOUQu0e1S3lHGrih1nFityctQQJ4+0jA+XPJ/XuHr2EnVnsIfO9Ac7stS/aECuXqulGDlZq+k8jKJpWMaEC4zw9K0MUexHLs1kVf6swbwziuY3yt5frlMZ2zBCtXtzrY9Ii+83Uj8Sj9HXXb/930jZuBSdH2JPNSM6SiEfiRiCNWY0ezF452nvCulfIlaXR+O8KjLhLTZ4Rzis4jgi5s6nV6ZZHEJ02A5gktYQuplzm6zel9Hvy1G5DYj/NRLO7T9mQAkWeUzm408J+ZFquzHzdvxFfcv1X/O0VaScfvaLAGTK3uuSBCYpkroyoiAW9bHc8bMDk4KqPMO8p5qREb/khAjIEruMwxSXbawhnnhz+UMFYEhsFyCXIBGm7j7jJtGEK7yVo89ueThoaIsD7srMGhXqPdfzVYUHR+WX7ObmFdTsIpyFNBiOkEpEZb+Q3T1teBA01bqi0Nv8HAArZ9tGqK59ycOk5KrDGpsRylr51rWpRBXoRcRiZoChNDhYJoqWZEuVRFkoYNWPzCQSCx268NKQ3VYzbAjSjxVS+TQmweFcNppxGyKS6jJucMrhGyx3Qr9TFUnCoS2pQajBtEC3/K00A5Uy8isfovHzY00Ams8CKFt5zI7OOZXl7N1IHeLbwPYq9wmdDl3agq59o7X7aSAS7oXPFYvxXS1WYVCRNUSJiTB7JgOGtwSZWhLM2MGme6x4RJ/D3Ai8ZBO39GzC5Jlb/q+XSbtXodGRXT18uMn64sssgdWkZStG5bXadjSK+EwELg0M44SxCKmvUXuJTw7vYgR1WhCX5aWb3u5XKrsL3Kk2EgXaUayVOOMpZTMTHYmudYWn8NmFXRYHbGsu7cymKLiF54DrkbvLshjAghzYAgA2hCtGd+96mc8RiUJIgJJZ3DRGuQOjsQK4GSHBZRVqnnJalNF1UALIL6g9lkGoOWnmkvysOe3emAHJhXm6rMVgwIwYJKoZIhvcNAQkVMRYEFF9xlvKoAojV6NBs15vXoSMPTqi7MDEGCSqGSIb3DQEJFDEkHiIAOAA4ADgAMQAyADMANAA1ADYAMAA0ADgANQAwADAAMAAxMIIGmwYJKoZIhvcNAQcGoIIGjDCCBogCAQAwggaBBgkqhkiG9w0BBwEwKAYK... <truncated>
   <eu:CertificateAlias>88812345604850001</eu:CertificateAlias>
</eu:AuthData>`

const PASSWORD = "88812345604850001"

const INTEGRATION_MANUAL_CONTENT = `KVERKOM - NOP Lite - Integračný manuál (draft)

Verzia dokumentu
================
Verzia 0.1 - 14. 8. 2025: Iniciálny dokument
Verzia 0.2 - 18. 8. 2025: Upravená formálna štruktúra
Verzia 0.3 - 27. 8. 2025: Doplnené vybrané prevádzkové údaje pre integračné prostredie

Prehľad a účel
===============
Toto API umožňuje bezpečný prístup k službám Notifikátor okamžitých platieb (NOP) v rámci projektu KVERKOM cez REST (HTTPS) a MQTT over TLS.
Prístup je chránený vzájomným TLS (mTLS) pomocou klientskych certifikátov.
Cieľ: poskytnúť technické pokyny, testovacie scenáre a pravidlá prevádzky pre partnerov.

Kontakty na podporu:
- Incidendy: (TBD)
- Onboarding: (TBD)
- Prevádzková doba podpory: (TBD)
- SLA: (TBD)

Prostredia a DNS
================
INT (integračné prostredie):
- API-BANKA Base URL: https://api-banka-i.kverkom.sk
- API-ERP Base URL: https://api-erp-i.kverkom.sk
- MQTT host/port: mqtt-i.kverkom.sk:8883
- Poznámka: self-service/onboarding

PROD (produkčné prostredie):
- API-BANKA Base URL: https://api-banka.kverkom.sk
- API-ERP Base URL: https://api-erp.kverkom.sk
- MQTT host/port: mqtt.kverkom.sk:8883
- Poznámka: ostrá prevádzka (TBD)

SNI: vyžadujeme správny hostname v TLS (SNI) zhodný s uvedenými doménami

IP whitelisting:
- Pre INT prostredie je rozsah IP obmedzený na Slovensko, Európu a USA
- Pre PROD prostredie: TBD

Časová zóna systému: Europe/Bratislava

Bezpečnosť a certifikáty (mTLS)
================================
Certifikačná politika:
- Akceptované klientské CA: DigiCert Global Root G2 (root) a GeoTrust TLS RSA CA G1 (intermediate)
- Cert formáty: PEM (.crt + .key) alebo PKCS#12 (.p12/.pfx)
- Podporované TLS: TLS 1.2+ (odporúčané 1.3)
- OCSP/CRL: (TBD)
- Expirácia: (TBD)
- Obnovenie certifikátu: (TBD)

Identita klienta:
Pre API-ERP a MQTT (klient typu "pokladnica"):
Subject: C = SK, OU = XXXXXXXXXXXXXXXXX, CN = VATSK-XXXXXXXXXX POKLADNICA XXXXXXXXXXXXXXXXX
z ktorej sa odvodí subjekt VATSK-1234567890 a pokladnica POKLADNICA-88812345678900001
a tieto údaje sa používajú na autorizáciu volaní a MQTT topic ACL

Pre API-BANKA (klient typu "banka"):
Subject DN (CN/OU/O) alebo organizationIdentifier - TBD

Postup získania/predloženia certifikátu:
- Pre "pokladnice": využívajú sa rovnaké certifikáty ako pre systém eKasa
- Pre "banky": využívajú sa QWAC certifikáty v zmysle kapitoly 3 v štandarde
  https://www.sbaonline.sk/projekt/standard-sluzby-notifikacie/

REST API (HTTPS)
================
Štandardy a verziovanie:
- OpenAPI: (viď prílohy)
- Verziovanie URI: napr. /api/v1/... (major verzia v ceste)
- Formát: JSON (UTF-8)
- Idempotencia: (viď jednotlivé služby v NOP Lite - NOP Services API)

Auth (mTLS):
- Ak je klientsky certifikát neplatný/chýba: HTTP 401
- Ak identita nemá oprávnenie: HTTP 403

Hlavičky cez F5 / proxy:
- Forwardované hlavičky: X-Forwarded-For, X-Forwarded-Proto, X-Request-ID
- (do klienta odporúčame posielať vlastný X-Correlation-ID)

Limity a time-outy:
- Max. veľkosť request body: (TBD) <napr. 5 MB>
- Read/Idle timeout: 30s
- Rate limit: (TBD) <napr. 600 req/min/klient>
- Burst: (TBD) <napr. 120 req>

Chybové kódy:
- 400: Neplatná požiadavka (INVALID_PAYLOAD: "Missing field ...")
- 401: Chýba/nesedí klientsky cert (MTLS_REQUIRED: "Client certificate required")
- 403: Zakázané (FORBIDDEN: "Not authorized for resource")
- 404: Nenašlo sa (NOT_FOUND: "Resource not found")
- 405: Nedovolená operácia (Method Not Allowed)
- 409: Konflikt (CONFLICT: "Duplicate")
- 415: Nepodporovaný typ (UNSUPPORTED_MEDIA_TYPE: "Use application/json")
- 422: Nevalidné dáta (VALIDATION_ERROR: "Field X ...")
- 429: Príliš veľa požiadaviek (RATE_LIMITED: "Retry later")
- 5xx: Interná chyba (INTERNAL_ERROR: "Try again")

MQTT (TLS, mTLS)
================
Protokol a vlastnosti:
- MQTT 3.1.1
- Transport: TLS na porte 8883, mTLS povinné
- KeepAlive: 60 s
- Max payload: (TBD, napr. 256 kB)
- Retained messages: áno, max 2 hod
- QoS: podporujeme 0 a 1
- Will message (LWT): N/A

Identita a autorizácia:
- Pri TLS handshaku identifikujeme klienta z certifikátu (viď Identita klienta vyššie)
- ACL: prístup na publish/subscribe je viazaný na identitu (cert) a topic patterny

Štruktúra topicov:
Pre SUBSCRIBE:
1. VATSK-XXXXXXXX/POKLADNICA-XXXXXXXXXXXXXX/QR-XXXXXXXXXXXXXXXXXXXXX
   prijíma správy pre dané konkrétne ID transakcie
   príklad: VATSK-1234567890/POKLADNICA-88812345678900001/QR-ab29e346f1d841c8a95a63d857490818

2. VATSK-XXXXXXXX/POKLADNICA-XXXXXXXXXXXXXX/#
   prijíma správy pre konkrétnu pokladnicu ale akúkoľvek transakciu
   príklad: VATSK-1234567890/POKLADNICA-88812345678900001/#

3. VATSK-XXXXXXXX/#
   prijíma správy pre všetky pokladnice v rámci daného DIČ
   príklad: VATSK-1234567890/#

Pre PUBLISH:
TRANSACTIONS/VATSK-XXXXXXXX/POKLADNICA-XXXXXXXXXXXXXX
po zápise správy v tvare {"request": "transaction_id"} systém vygeneruje nove transactionId
a publikuje do MQTT na topic VATSK-XXXXXXXX/POKLADNICA-XXXXXXXXXXXXXX správu
vo formáte popísanom v službe generateNewTransactionId.

Kvalita služby (QoS) a doručovanie:
- QoS 1: garantuje "aspoň raz", klient musí implementovať de-duplikáciu
- Retain: len na kanáloch VATSK-XXXXXXXX/#, max TTL 2h

Dátové formáty a konvencie
===========================
- JSON kľúče v camelCase
- Čas: ISO-8601 UTC (2025-08-27T09:00:00Z)
- Číselné formáty: desatinná bodka
- Identifikátory: N/A
- Schémy: (TBD, vid priklady; rovnaké pre REST aj MQTT payloady)

Monitoring, metriky a health-check
===================================
- REST: GET /api/v1/status (bez citlivých údajov)
- MQTT: publish spravy "test/ping" na topic "test/ping"
- Metriky klienta (odporúčané): (TBD)

Prevádzkové zásady
==================
- Backoff & retry: exponenciálny backoff (napr. 1s, 2s, 4s, max 30s), max 5 pokusov
- Zmeny kontraktu: backward-compatible 6 mesiacov; breaking zmeny vo verzii v{n+1}
- Deprekácia: oznámenie min. 90 dní vopred
- Údržbové okná: (TBD)
- Logovanie: (TBD)
- GDPR/PII: neposielať senzitivitu bez právneho základu; dáta v transporte vždy cez TLS
- Časové synchronizácie: NTP (drift < 200 ms)

Mapovanie chýb (detail)
========================
- REST - telo chyby: (TBD)
- MQTT - chybové eventy: (TBD)
- Changelog (pre klientov): (TBD)

Príklady volaní a základné testovacie scenáre
==============================================
Uvádzame dva spôsoby rýchleho otestovania rozhraní a funkcionality NOP:
1. Testovanie použitím command-line príkladov (curl, mosquitto) - použiteľné na Windows aj Linux
2. Testovanie použitím pripraveného python skriptu (kverkom_test.py) - použiteľné na všetkých platformách s Python3

Predpoklady:
- Všetky hosty a porty sú dostupné z internetu (zo slovenských IP adries, resp. z Európy a USA):
  * api-banka-i.kverkom.sk:443
  * api-erp-i.kverkom.sk:443
  * mqtt-i.kverkom.sk:8883

- Tester disponuje platným certifikátom - v príkladoch používame tieto konkrétne názvy:
  * "kverkom-int-client.pem" - klientsky certifikát v PEM formáte
  * "kverkom-int-client.key" - kľúč k certifikátu
  * "kverkom-ca-bundle.pem" - serverový certifikát (bundle) v PEM formáte

Testovanie z príkazového riadku
================================
Čo budeme potrebovať:
- Windows 10+ alebo Linux (aktuálny)
- Nástroj "curl" (pre volanie HTTP/REST služieb)
- Nástroj "mosquitto client" (pre volanie MQTT subscribe resp. publish)
- (voliteľne) openssl

Overenie platnosti certifikátu:
openssl s_client -connect api-erp-i.kverkom.sk:443 -cert kverkom-int-client.pem -key kverkom-int-client.key -CAfile kverkom-ca-bundle.pem

Overenie dostupnosti serverov a služieb:
curl -s -S -i -X GET https://api-erp-i.kverkom.sk/api/v1/status --cert kverkom-int-client.pem --key kverkom-int-client.key --cacert kverkom-ca-bundle.pem
curl -s -S -i -X GET https://api-banka-i.kverkom.sk/api/v1/status --cert kverkom-int-client.pem --key kverkom-int-client.key --cacert kverkom-ca-bundle.pem

Scenár - okamžitá platba na pokladni
=====================================
1. Vygenerovanie (nového) transactionId:
curl -s -S -i -X POST https://api-erp-i.kverkom.sk/api/v1/generateNewTransactionId --cert kverkom-int-client.pem --key kverkom-int-client.key --cacert kverkom-ca-bundle.pem

2. Čakanie na notifikáciu:
mosquitto_sub -h mqtt-i.kverkom.sk -p 8883 -v -q 1 -t "VATSK-1234567890/POKLADNICA-88812345678900001/QR-01c40ef8bb2541659c2bd4abfb6a9964" --cafile kverkom-ca-bundle.pem --cert kverkom-int-client.pem --key kverkom-int-client.key -d

3. Zaslanie notifikácie:
curl -s -S -i -X POST https://api-banka-i.kverkom.sk/api/v1/payments -H "Content-Type: application/json" -H "X-Request-ID: 84c457b1-048b-4ca3-8df6-6e965c866333" --data '{"transactionStatus":"ACCC","transactionAmount":{"currency":"EUR","amount":"667.00"},"endToEndId":"QR-01c40ef8bb2541659c2bd4abfb6a9964","dataIntegrityHash":"ABCDEF"}' --cert kverkom-int-client.pem --key kverkom-int-client.key --cacert kverkom-ca-bundle.pem

Testovanie použitím python skriptu kverkom_test.py
===================================================
Čo budeme potrebovať:
- Nainštalovaný python (verzia 3.7+)

Inštalácia skriptu kverkom_test.py:
1. Stiahnuť balík so skriptom - vid príloha alebo linka/git (TBD) - kverkom_test_v1.zip
2. Rozbaliť v lokálnom adresári
3. Nainštalovať potrebné knižnice

Použitie:
kverkom_test.py erpStatus [-d]
kverkom_test.py bankStatus [-d]
kverkom_test.py newTransaction [-d]
kverkom_test.py getAllTransactions POKLADNICA [-d]
kverkom_test.py wait VATSK [POKLADNICA [TRANSACTIONID]] [-d]
kverkom_test.py notify IBAN AMOUNT END_TO_END_ID [-h HOST] [-d]
kverkom_test.py erp VATSK POKLADNICA [-d]

Scenár - okamžitá platba na pokladni:
kverkom_test.py erp VATSK-1234567890 POKLADNICA-88812345678900002 -d

V ďalšom okne:
kverkom_test.py notify SK4811000000002944116480 123.45 QR-e22732a02dca40ed8d850b0e38ed130e

Referencie a prílohy
====================
- Štandard platobnej linky: https://www.sbaonline.sk/projekt/standard-platobnej-linky/
- Štandard pre PushPaymentNotification: https://www.sbaonline.sk/projekt/standard-sluzby-notifikacie/
- Popis NOP API: NOP Lite - NOP Services API
- Testovací skript: py-kverkom.zip
- SWAGGER (OpenAPI 3) definície:
  * bank-api-openapi.yaml
  * erp-api-openapi.yaml
`

const downloadXmlFile = () => {
  const blob = new Blob([SAMPLE_XML_FILE], { type: "application/xml" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "88812345604850001_platny_v2.0_20270903.xml"
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const downloadIntegrationManual = () => {
  const blob = new Blob([INTEGRATION_MANUAL_CONTENT], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "KVERKOM-NOP-Lite-Integracny-Manual.txt"
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function DownloadPage() {
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(PASSWORD)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy password:", err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-2xl space-y-6">
          <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-6 px-4 sm:px-6">
              <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                Stiahnuť XML súbor s autentifikačnými údajmi
              </CardTitle>
              <p className="text-xs sm:text-sm text-gray-600 mt-2">
                XML súbor s autentifikačnými údajmi pre testovanie aplikácie
              </p>
            </CardHeader>
            <CardContent className="space-y-6 px-4 sm:px-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">
                      XML súbor a heslo do testovacieho prostredia aplikácie
                    </h3>
                    <p className="text-xs sm:text-sm text-blue-800 mb-4 leading-relaxed">
                      Tento súbor obsahuje autentifikačné údaje vo formáte XML, ktoré môžete použiť na prihlásenia sa do
                      testovacieho prostredia aplikácie.
                    </p>

                    <div className="bg-white rounded border border-blue-200 p-2 sm:p-3 mb-4">
                      <div className="text-xs text-gray-600 mb-1">Názov súboru:</div>
                      <div className="font-mono text-xs sm:text-sm text-gray-900 break-all">
                        88812345604850001_platny_v2.0_20270903.xml
                      </div>
                    </div>

                    <Button
                      onClick={downloadXmlFile}
                      className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto text-sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Stiahnuť XML súbor
                    </Button>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                      <div className="text-xs sm:text-sm text-green-800 mb-2">
                        <strong>Heslo pre testovanie:</strong>
                      </div>
                      <div className="flex items-center gap-2 bg-white rounded border border-green-200 p-2">
                        <code className="font-mono text-xs sm:text-sm text-gray-900 flex-1 break-all">{PASSWORD}</code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={copyPassword}
                          className="h-8 w-8 p-0 hover:bg-green-100 flex-shrink-0"
                        >
                          {copied ? (
                            <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                          )}
                        </Button>
                      </div>
                      {copied && <div className="text-xs text-green-600 mt-1">Heslo bolo skopírované!</div>}
                    </div>

                    <div className="text-center pt-4">
                      <Button
                        variant="outline"
                        onClick={() => router.push("/")}
                        className="text-gray-600 hover:text-gray-900 w-full sm:w-auto text-sm"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Späť na prihlásenie
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-6 px-4 sm:px-6">
              <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                Integračný manuál
              </CardTitle>
              <p className="text-xs sm:text-sm text-gray-600 mt-2">KVERKOM - NOP Lite - Integračný manuál (draft)</p>
            </CardHeader>
            <CardContent className="space-y-6 px-4 sm:px-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <Info className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-purple-900 mb-2 text-sm sm:text-base">
                      Komplexný integračný manuál pre NOP Lite
                    </h3>
                    <p className="text-xs sm:text-sm text-purple-800 mb-4 leading-relaxed">
                      Tento dokument obsahuje technické pokyny, testovacie scenáre a pravidlá pre integráciu s NOP Lite
                      (Notifikátor okamžitých platieb).
                    </p>

                    <Button
                      onClick={downloadIntegrationManual}
                      className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto text-sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Stiahnuť integračný manuál
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
