# NOP Web Test Client

Webová aplikácia pre generovanie QR kódov na platby a príjem potvrdení o platbe zo systému NOP, ktorý je integrovaný na banky.

## Čo táto aplikácia robí?

Táto aplikácia umožňuje:
- Nahrať certifikát obchodníka (P12 súbor)
- Generovať QR kódy pre platby
- Prijímať notifikácie z banky cez MQTT
- Zobraziť potvrdenia o platbách
- Správa nepotvrdených platieb

## Čo potrebuješ pred začatím

Pred inštaláciou aplikácie si musíš nainštalovať:

1. **Node.js** (verzia 18 alebo vyššia)
   - Stiahni z: https://nodejs.org/
   - Po inštalácii over verziu príkazom: `node --version`

2. **Git**
   - Stiahni z: https://git-scm.com/
   - Po inštalácii over verziu príkazom: `git --version`

3. **Supabase účet** (databáza)
   - Zaregistruj sa na: https://supabase.com/
   - Je to zadarmo pre malé projekty

4. **Vercel účet** (pre nasadenie)
   - Zaregistruj sa na: https://vercel.com/
   - Môžeš sa prihlásiť cez GitHub účet

## Krok 1: Stiahnutie aplikácie

1. Otvor terminál (Command Prompt na Windows, Terminal na Mac/Linux)

2. Prejdi do priečinka, kde chceš mať aplikáciu:
   \`\`\`bash
   cd Desktop
   \`\`\`

3. Naklonuj repozitár (stiahni kód):
   \`\`\`bash
   git clone https://github.com/tvoj-uzivatel/nop-web-test-client.git
   \`\`\`

4. Prejdi do priečinka aplikácie:
   \`\`\`bash
   cd nop-web-test-client
   \`\`\`

5. Nainštaluj potrebné balíčky:
   \`\`\`bash
   npm install
   \`\`\`

## Krok 2: Nastavenie databázy (Supabase)

1. Prihlás sa na https://supabase.com/

2. Vytvor nový projekt:
   - Klikni na "New Project"
   - Zadaj názov projektu (napr. "nop-client")
   - Vytvor silné heslo (ulož si ho!)
   - Vyber región (Europe West je dobrá voľba)
   - Klikni "Create new project"

3. Počkaj 2-3 minúty, kým sa projekt vytvorí

4. Spusti SQL skripty na vytvorenie tabuliek:
   
   **DÔLEŽITÉ:** Skripty musíš spustiť v správnom poradí!
   
   - V Supabase dashboarde klikni na "SQL Editor" v ľavom menu
   - Klikni na "New query"
   
   **Krok 4.1 - Vyčistenie databázy (voliteľné, len ak chceš začať odznova):**
   - Otvor súbor `scripts/000_drop_all_tables.sql` vo svojom editore
   - Skopíruj celý obsah a vlož ho do SQL editora
   - Klikni "Run" (alebo stlač F5)
   - **POZOR:** Tento skript vymaže všetky existujúce tabuľky a dáta!
   
   **Krok 4.2 - Vytvorenie tabuľky transaction_generations:**
   - Otvor súbor `scripts/001_create_transaction_generations_table.sql`
   - Skopíruj celý obsah a vlož ho do SQL editora
   - Klikni "Run" (alebo stlač F5)
   
   **Krok 4.3 - Vytvorenie tabuľky mqtt_notifications:**
   - Otvor súbor `scripts/002_create_mqtt_notifications_table.sql`
   - Skopíruj celý obsah a vlož ho do SQL editora
   - Klikni "Run" (alebo stlač F5)
   
   **Krok 4.4 - Vytvorenie tabuľky mqtt_subscriptions:**
   - Otvor súbor `scripts/003_create_mqtt_subscriptions_table.sql`
   - Skopíruj celý obsah a vlož ho do SQL editora
   - Klikni "Run" (alebo stlač F5)

5. Over, že sa tabuľky vytvorili:
   - Klikni na "Table Editor" v ľavom menu
   - Mali by si vidieť tieto tabuľky:
     - `transaction_generations` - ukladá vygenerované transakcie a QR kódy
     - `mqtt_notifications` - ukladá prijaté MQTT notifikácie z banky
     - `mqtt_subscriptions` - sleduje aktívne MQTT subscriptions

### Štruktúra databázových tabuliek

**transaction_generations:**
- `id` - UUID primárny klúč
- `transaction_id` - Unikátny identifikátor transakcie
- `vatsk` - DIČO organizácie
- `pokladnica` - Identifikátor pokladnice
- `iban` - IBAN účtu
- `amount` - Suma platby (NUMERIC 10,2)
- `status_code` - HTTP status kód odpovede
- `duration_ms` - Trvanie požiadavky v milisekundách
- `client_ip` - IP adresa klienta
- `response_timestamp` - Časová pečiatka odpovede (TIMESTAMPTZ)
- `dispute` - Príznak sporu (BOOLEAN)
- `created_at` - Čas vytvorenia záznamu (TIMESTAMPTZ)

**mqtt_notifications:**
- `id` - UUID primárny klúč
- `topic` - MQTT topic
- `raw_payload` - Surový payload z MQTT
- `vatsk` - DIČO organizácie
- `pokladnica` - Identifikátor pokladnice
- `transaction_id` - ID transakcie
- `transaction_status` - Status transakcie
- `amount` - Suma platby (NUMERIC 10,2)
- `currency` - Mena platby
- `integrity_hash` - Hash pre overenie integrity
- `end_to_end_id` - End-to-end identifikátor
- `payload_received_at` - Čas prijatia payloadu (TIMESTAMPTZ)
- `created_at` - Čas vytvorenia záznamu (TIMESTAMPTZ)
- `integrity_validation` - Výsledok validácie integrity (BOOLEAN)

**mqtt_subscriptions:**
- `id` - UUID primárny klúč
- `topic` - MQTT topic
- `vatsk` - DIČO organizácie
- `pokladnica` - Identifikátor pokladnice
- `end_to_end_id` - End-to-end identifikátor
- `qos` - Quality of Service level (INTEGER)
- `timestamp` - Časová pečiatka subscription (TIMESTAMPTZ)
- `created_at` - Čas vytvorenia záznamu (TIMESTAMPTZ)

### Row Level Security (RLS)

Všetky tabuľky majú nakonfigurované RLS politiky:
- **Anonymous users** - môžu čítať všetky záznamy
- **Authenticated users** - môžu čítať, vkladať a upravovať záznamy
- **Service role** - má plný prístup ku všetkým operáciám

## Krok 3: Nastavenie premenných prostredia

1. V Supabase dashboarde klikni na "Settings" (ikona ozubeného kolieska)

2. Klikni na "API" v ľavom menu

3. Nájdi a skopíruj tieto hodnoty:
   - **Project URL** (napr. `https://xxxxx.supabase.co`)
   - **anon public** kľúč (dlhý reťazec znakov)
   - **service_role** kľúč (ešte dlhší reťazec)

4. Vytvor súbor `.env.local` v hlavnom priečinku projektu:
   \`\`\`bash
   touch .env.local
   \`\`\`

5. Otvor `.env.local` v textovom editore a pridaj:
   \`\`\`
   NEXT_PUBLIC_SUPABASE_URL=tvoja-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tvoj-anon-key
   SUPABASE_SERVICE_ROLE_KEY=tvoj-service-role-key
   \`\`\`

6. Nahraď hodnoty tými, ktoré si skopíroval z Supabase

7. **CA certifikát:**
   
   Pridaj ho do `.env.local`:
   \`\`\`
   NEXT_PUBLIC_EMBEDDED_CA_BUNDLE=-----BEGIN CERTIFICATE-----
   MIIDXTCCAkWgAwIBAgIJAKZ...
   (celý obsah CA certifikátu)
   ...
   -----END CERTIFICATE-----
   \`\`\`
   
   **Poznámka:** CA certifikát musí byť vo formáte PEM a môže obsahovať viacero certifikátov v reťazci.
   Certifikát najdeš na https://crt.sh/
   Zadaním: 
   api-banka.kverkom.sk pre PROD
   api-banka-i.kverkom.sk  pre INT prostredie


## Krok 4: Spustenie aplikácie lokálne

1. V terminále (v priečinku projektu) spusti:
   \`\`\`bash
   npm run dev
   \`\`\`

2. Počkaj, kým sa aplikácia spustí (zobrazí sa "Ready in X seconds")

3. Otvor prehliadač a choď na:
   \`\`\`
   http://localhost:3000
   \`\`\`

4. Mala by sa ti zobraziť prihlasovacia stránka aplikácie!

5. Nastav premenné prostredia:
   - V sekcii "Environment Variables" pridaj tie isté premenné ako v `.env.local`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_EMBEDDED_CA_BUNDLE` 

## Krok 5: Nasadenie na Vercel (produkcia)

1. Prihlás sa na https://vercel.com/

2. Klikni na "Add New..." → "Project"

3. Importuj svoj Git repozitár:
   - Ak máš kód na GitHube, vyber ho zo zoznamu
   - Ak nie, najprv nahraj kód na GitHub

4. Nastav premenné prostredia:
   - V sekcii "Environment Variables" pridaj tie isté premenné ako v `.env.local`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_EMBEDDED_CA_BUNDLE`

5. Klikni "Deploy"

6. Počkaj 2-3 minúty, kým sa aplikácia nasadí

7. Po dokončení dostaneš URL adresu (napr. `https://tvoj-projekt.vercel.app`)

8. Otvor túto URL v prehliadači - aplikácia je teraz online!

## Technické detaily

### Použité technológie
- **Next.js 16** - React framework s App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS v4** - Utility-first CSS framework
- **Supabase** - PostgreSQL databáza s real-time capabilities
- **MQTT** - Message broker pre real-time notifikácie
- **shadcn/ui** - UI komponenty

### Štruktúra projektu
\`\`\`
nop-web-test-client/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── notifications/     # Dashboard pre notifikácie
│   └── page.tsx          # Hlavná stránka
├── components/            # React komponenty
├── lib/                   # Utility funkcie a Supabase klienti
├── scripts/              # SQL skripty pre databázu
└── public/               # Statické súbory
\`\`\`

### API Endpoints
- `POST /api/generate-transaction` - Generuje novú transakciu a QR kód
- `POST /api/mqtt/subscribe` - Vytvorí MQTT subscription
- `POST /api/mqtt/save` - Uloží MQTT notifikáciu do databázy

---

**Vibecoded in Vercel V0** | [GitHub](https://github.com/tvoj-uzivatel/nop-web-test-client)
