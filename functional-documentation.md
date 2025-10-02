# NOP Web Test Client - Functional Documentation

## Overview
NOP Web Test Client is a secure certificate-based payment application that enables QR code payments through Slovak banking systems. The application provides a complete payment workflow from certificate authentication to real-time payment notifications via MQTT with comprehensive transaction tracking.

## Core Functions in page.tsx

### Utility Functions

#### `isValidIbanFormat(iban: string): boolean`
**Purpose:** Validates IBAN format using regex pattern matching.
- Removes spaces and checks for 24-character Slovak IBAN format
- Uses regex `/^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/` for basic format validation
- Returns boolean indicating if IBAN matches expected format

#### `sanitizeInput(input: string): string`
**Purpose:** Security function to prevent XSS attacks by sanitizing user input.
- Removes `<script>` tags and JavaScript event handlers
- Strips `javascript:` protocol and `on*=` attributes
- Used as callback with `useCallback` for performance optimization

#### `validateIbanSecure(iban: string): boolean`
**Purpose:** Enhanced IBAN validation with checksum verification.
- Sanitizes input and performs length validation (15-34 characters)
- Implements mod-97 checksum algorithm per ISO 13616
- Rearranges IBAN and converts letters to numbers for validation
- Returns true only if checksum remainder equals 1

#### `formatIban(value: string): string`
**Purpose:** Formats IBAN display with spaces every 4 characters.
- Removes existing spaces and converts to uppercase
- Adds space after every 4 characters for readability
- Used for user-friendly IBAN display in input fields

### API Communication Functions

#### `handleApiCallWithRetry(apiCall: () => Promise<any>, maxRetries = 3, delay = 1000): Promise<any>`
**Purpose:** Implements retry logic with exponential backoff for API calls.
- Attempts API call up to `maxRetries` times
- Uses exponential backoff: delay × 2^(attempt-1)
- Manages timers in `timersRef` for cleanup
- Throws last error if all attempts fail

#### `logApiCall(log: ApiCallLog): void`
**Purpose:** Logs API calls for debugging and monitoring.
- Adds log entry to `apiCallLogs` state
- Maintains only last 20 logs to prevent memory issues
- Used throughout application for comprehensive API tracking

#### `clearApiLogs(): void`
**Purpose:** Clears all API call logs from state.
- Resets `apiCallLogs` to empty array
- Used by clear button in API console interface

### Payment and QR Code Functions

#### `generatePaymentLink(amount: string, transactionId: string): string`
**Purpose:** Creates payment link URL for QR code generation.
- Constructs URL with payment parameters (IBAN, amount, currency, etc.)
- Uses URLSearchParams for proper encoding
- Returns `https://payme.sk/` link with transaction details

#### `generateQrCodeSecure(data: string): Promise<string>`
**Purpose:** Secure QR code generation with memory management.
- Revokes previous QR code data URLs to prevent memory leaks
- Uses QRCode library with 256px width and error correction level M
- Stores reference in `qrDataUrlRef` for cleanup
- Returns base64 data URL for display

#### `generateQRCode(text: string): Promise<string>`
**Purpose:** Alternative QR code generation function.
- Creates 300px QR code with standard settings
- Used for secondary QR codes in the interface
- Returns base64 data URL without memory management

#### `roundToFiftyCents(value: string): string`
**Purpose:** Rounds monetary amounts to nearest 50 cents.
- Parses string to number and rounds using `Math.round(num * 2) / 2`
- Returns formatted string with 2 decimal places
- Currently unused but available for payment rounding

### Amount Input Functions

#### `handleEurAmountChange(value: string): void`
**Purpose:** Handles EUR amount input with digit-only validation.
- Strips non-numeric characters using regex `/[^0-9]/g`
- Limits input to 7 digits maximum (99999.99 EUR)
- Updates `eurAmount` state with validated input

#### `formatEurAmountDisplay(digits: string): string`
**Purpose:** Formats digit string for currency display.
- Handles empty/zero cases returning "0,00"
- Pads with leading zeros for proper cent calculation
- Splits into euros and cents (last 2 digits)
- Adds thousands separator and comma decimal separator

#### `getEurAmountValue(): string`
**Purpose:** Converts digit string to decimal format for API calls.
- Processes `eurAmount` state into "X.XX" format
- Handles padding and splitting for proper decimal conversion
- Returns string suitable for payment API parameters

#### `formatEurAmountForApi(amount: string): number`
**Purpose:** Converts amount string to numeric value for calculations.
- Similar to `getEurAmountValue` but returns number type
- Used for mathematical operations and API calls requiring numeric amounts

### Certificate Management Functions

#### `convertXmlToPem(xmlFile: File, password: string): Promise<{certPem: string; keyPem: string} | null>`
**Purpose:** Converts XML certificate data to PEM format.
- Extracts certificate alias (POKLADNICA) from XML
- Parses base64 data from `<eu:Data>` element
- Calls `/api/convert-p12-to-pem` endpoint with P12 data and password
- Updates `certificateInfo` state with extracted VATSK and POKLADNICA
- Returns PEM certificate and private key or null on failure

#### `downloadPemFile(pemContent: string, filename: string): void`
**Purpose:** Downloads PEM content as file to user's device.
- Creates blob with PEM content and appropriate MIME type
- Generates temporary download URL and triggers download
- Cleans up URL after download to prevent memory leaks

#### `validateFiles(): boolean`
**Purpose:** Validates required certificate files are present.
- Checks for `xmlAuthData` and `caCert` files
- Sets error message if files missing
- Returns boolean indicating validation success

### Configuration Management Functions

#### `handleSaveConfiguration(): Promise<void>`
**Purpose:** Main configuration save function with certificate conversion.
- Validates required files and password are present
- Uses retry logic for certificate conversion
- Creates embedded CA bundle file
- Updates file state with converted PEM certificates
- Sets `configurationSaved` flag and collapses certificate section
- Comprehensive error handling with user-friendly messages

#### `resetConfiguration(): void`
**Purpose:** Resets all configuration data to initial state.
- Clears all file states and user inputs
- Resets certificate info and UI states
- Expands certificate section for new configuration
- Used by reset button to start fresh configuration

#### `handleFileChange(type: keyof CertificateFiles, file: File | null): Promise<void>`
**Purpose:** Handles file upload changes for certificate files.
- Updates files state with new file for specified type
- Async function to support future file validation
- Used by file input components

### MQTT and Payment Functions

#### `subscribeToBankNotifications(): Promise<void>`
**Purpose:** Subscribes to MQTT notifications for payment confirmations.
- Validates files before proceeding
- Constructs MQTT topic using VATSK/POKLADNICA/transactionId
- Calls `/api/mqtt-subscribe` with certificate data
- Manages MQTT connection state and messages
- Handles received messages and displays modal if payments found
- Comprehensive logging and error handling

#### `stopMqttSubscription(): void`
**Purpose:** Stops active MQTT subscription.
- Sets `mqttConnected` to false
- Clears MQTT messages array
- Used to manually stop listening for notifications

#### `subscribeToQrBankNotifications(transactionId: string): Promise<void>`
**Purpose:** Specialized MQTT subscription for QR code payments.
- Similar to `subscribeToBankNotifications` but for specific transaction
- Automatically triggered after QR code generation
- Handles payment confirmation and integrity verification
- Shows payment received modal on successful notification
- Includes 2-second verification process with hash comparison

### Data Integrity Functions

#### `generateDataIntegrityHash(iban: string, amount: string, currency: string, endToEndId: string): Promise<string>`
**Purpose:** Generates SHA-256 hash for payment data integrity verification.
- Concatenates payment parameters with pipe separator
- Uses Web Crypto API for secure hash generation
- Returns hex-encoded hash string
- Used to verify payment notification authenticity

### QR Code Generation Workflow

#### `handleQrGeneration(): Promise<void>`
**Purpose:** Main QR code generation workflow function.
- Validates configuration and certificate files
- Checks amount is greater than zero
- Shows QR modal and sets loading state
- Calls `/api/generate-transaction` to get transaction ID
- Generates payment link and QR code
- Automatically starts MQTT subscription for payment notifications
- Comprehensive error handling and logging throughout process

### UI Event Handlers

#### `handleIbanChange(e: React.ChangeEvent<HTMLInputElement>): void`
**Purpose:** Handles IBAN input field changes with validation.
- Sanitizes input and formats with spaces
- Validates IBAN format and updates UI state
- Auto-collapses certificate section when valid IBAN entered
- Uses callbacks for performance optimization

#### `handleScanToggle(): void`
**Purpose:** Manages scan toggle functionality with timer.
- Activates scan toggle for 7 seconds
- Updates remaining time counter every second
- Automatically deactivates after timeout
- Used for secondary QR code blur control

#### `handleQrModalClose(open: boolean): void`
**Purpose:** Controls QR modal closing behavior.
- Only allows closing when explicitly set to false
- Prevents accidental closing from outside clicks
- Used to maintain QR code visibility during payment process

### Transaction Management Functions

#### `handleTransactionListClick(): void`
**Purpose:** Opens transaction date selection modal.
- Sets `showTransactionDateModal` to true
- First step in transaction history viewing workflow

#### `handleTransactionDateSelect(): Promise<void>`
**Purpose:** Fetches transactions for selected date from database.
- Closes date modal and opens transaction list modal
- Constructs date range queries for Supabase
- Queries `mqtt_notifications` table with date filtering
- Handles timezone considerations with UTC date ranges
- Updates transaction list state with results

#### `calculateTransactionTotal(): number`
**Purpose:** Calculates total amount from transaction list.
- Reduces transaction array to sum of amounts
- Parses amount strings to numbers for calculation
- Returns total as number for display

#### `printTransactionSummary(): void`
**Purpose:** Generates printable transaction summary.
- Creates HTML content with transaction statistics
- Opens new window with formatted summary
- Includes date, count, total, and generation timestamp
- Triggers browser print dialog

#### `printAllTransactions(): void`
**Purpose:** Generates printable detailed transaction list.
- Creates HTML table with all transaction details
- Includes time, transaction ID, and amount columns
- Formats data for professional printing
- Opens in new window and triggers print

### Utility Functions

#### `copyAllLogs(): void`
**Purpose:** Copies all API logs to clipboard.
- Converts log array to formatted JSON string
- Uses Clipboard API for copying
- Provides feedback via console logging
- Used for debugging and support purposes

#### `canSaveConfiguration: boolean`
**Purpose:** Computed property determining if configuration can be saved.
- Checks for required files, password, valid IBAN
- Ensures configuration not already saved
- Used to enable/disable save button

#### `allRequiredFieldsComplete: boolean`
**Purpose:** Computed property for UI state management.
- Validates all required fields are completed
- Used to show/hide UI sections and enable features

## State Management

### Primary State Variables
- `files`: Certificate files and conversion results
- `userIban`: User's bank account IBAN
- `eurAmount`: Payment amount in digit format
- `configurationSaved`: Boolean flag for configuration status
- `certificateInfo`: Extracted VATSK and POKLADNICA values
- `mqttMessages`: Real-time MQTT communication logs
- `apiCallLogs`: Comprehensive API call history
- `transactionListData`: Database query results for transactions

### UI State Variables
- `showQrModal`: Controls QR code display modal
- `showPaymentReceivedModal`: Payment confirmation modal
- `showTransactionListModal`: Transaction history modal
- `qrLoading`: Loading state for QR generation
- `mqttLoading`: Loading state for MQTT operations
- `subscriptionActive`: MQTT subscription status

## Security Features

### Input Validation
- All user inputs sanitized to prevent XSS
- IBAN validation with checksum verification
- File type validation for certificate uploads
- Amount validation with reasonable limits

### Certificate Security
- Temporary file creation with automatic cleanup
- Memory-safe certificate parsing
- No persistent storage of sensitive data
- Session-based certificate management

### API Security
- Certificate-based authentication for all banking APIs
- TLS encryption for all communications
- Comprehensive error handling without information disclosure
- Audit logging of all operations

## Performance Optimizations

### Memory Management
- QR code data URL cleanup to prevent memory leaks
- Timer cleanup in useEffect hooks
- Limited API log retention (20 entries)
- Efficient state updates with useCallback

### API Efficiency
- Retry logic with exponential backoff
- Connection reuse where possible
- Optimized database queries with proper indexing
- Async operations to prevent UI blocking

## API Routes Documentation

### `/api/convert-p12-to-pem` (POST)
**Purpose:** Converts PKCS#12 certificate data to PEM format for use with banking APIs.

**Input Parameters:**
- `p12File`: File - PKCS#12 certificate file extracted from XML
- `password`: string - Certificate password for decryption

**Process Flow:**
1. Validates input file and password presence
2. Converts file to buffer and base64 encodes for node-forge
3. Parses PKCS#12 using ASN.1 decoder with provided password
4. Extracts certificate and private key bags
5. Converts to PEM format using forge.pki methods
6. Extracts VATSK (tax ID) from certificate subject attributes
7. Returns PEM certificate, private key, and extracted VATSK

**Security Features:**
- Input validation for file presence and type
- Secure password handling without logging
- Memory-safe certificate parsing
- Error handling without sensitive data exposure

**Response Format:**
\`\`\`json
{
  "certificate": "-----BEGIN CERTIFICATE-----...",
  "privateKey": "-----BEGIN PRIVATE KEY-----...",
  "vatsk": "1234567890"
}
\`\`\`

### `/api/generate-transaction` (POST)
**Purpose:** Generates new transaction ID from banking API using client certificates.

**Input Parameters:**
- `clientCert`: File/string - PEM client certificate
- `clientKey`: File/string - PEM private key
- `caCert`: File/string - CA certificate bundle

**Process Flow:**
1. Creates temporary certificate files with unique session ID
2. Extracts VATSK and POKLADNICA from client certificate
3. Executes cURL command to banking API with mTLS authentication
4. Parses JSON response for transaction ID
5. Saves transaction generation record to database (fire-and-forget)
6. Cleans up temporary files automatically

**Security Features:**
- Temporary file creation with automatic cleanup
- Session-based file naming to prevent conflicts
- Certificate validation and parsing
- Secure API communication with mTLS
- No persistent storage of certificate data

**Database Integration:**
- Fire-and-forget database saves to `transaction_generations` table
- Tracks transaction metadata, timing, and client information
- Non-blocking operation - API returns immediately

**Response Format:**
\`\`\`json
{
  "success": true,
  "data": {
    "transaction_id": "QR-abc123...",
    "status": "success"
  },
  "clientIP": "192.168.1.1",
  "timestamp": "2024-01-01T12:00:00Z"
}
\`\`\`

### `/api/mqtt-subscribe` (POST)
**Purpose:** Subscribes to MQTT broker for real-time payment notifications.

**Input Parameters:**
- `clientCert`: File/string - PEM client certificate
- `clientKey`: File/string - PEM private key  
- `caCert`: File/string - CA certificate bundle
- `transactionId`: string - Transaction ID to monitor
- `vatsk`: string - Tax identification number
- `pokladnica`: string - Cash register identifier

**Process Flow:**
1. Creates temporary certificate files for MQTT connection
2. Constructs MQTT topic: `VATSK-{vatsk}/POKLADNICA-{pokladnica}/{transactionId}`
3. Establishes secure MQTT connection using certificates
4. Subscribes to topic with QoS level 1
5. Listens for messages for 120 seconds or until first message
6. Saves subscription and notification data to database (fire-and-forget)
7. Returns immediately upon message receipt or timeout

**MQTT Configuration:**
- Host: `mqtt-i.kverkom.sk:8883`
- Protocol: MQTTS (MQTT over TLS)
- TLS Version: 1.2
- Certificate-based authentication
- QoS Level: 1 (at least once delivery)

**Database Integration:**
- Saves subscription details to `mqtt_subscriptions` table
- Saves received notifications to `mqtt_notifications` table
- Fire-and-forget pattern for non-blocking operation
- Parses JSON payloads for structured data storage

**Response Format:**
\`\`\`json
{
  "success": true,
  "hasMessages": true,
  "messages": ["payment notification JSON"],
  "messageCount": 1,
  "communicationLog": ["timestamped log entries"],
  "clientIP": "192.168.1.1",
  "listeningDuration": "Message received immediately"
}
\`\`\`

## Database Schema

### `transaction_generations` Table
Tracks all transaction generation requests for audit and analytics.

**Columns:**
- `id`: Primary key (auto-increment)
- `transaction_id`: Generated transaction identifier
- `vatsk`: Tax identification number
- `pokladnica`: Cash register identifier
- `endpoint`: API endpoint called
- `method`: HTTP method used
- `status_code`: Response status code
- `duration_ms`: Request duration in milliseconds
- `client_ip`: Client IP address
- `response_timestamp`: Response timestamp
- `created_at`: Record creation timestamp

### `mqtt_subscriptions` Table
Records all MQTT subscription attempts for monitoring.

**Columns:**
- `id`: Primary key (auto-increment)
- `topic`: MQTT topic subscribed to
- `vatsk`: Tax identification number
- `pokladnica`: Cash register identifier
- `end_to_end_id`: Transaction identifier
- `qos`: Quality of Service level
- `created_at`: Subscription timestamp

### `mqtt_notifications` Table
Stores all received payment notifications for transaction history.

**Columns:**
- `id`: Primary key (auto-increment)
- `topic`: MQTT topic where message was received
- `raw_payload`: Complete JSON message payload
- `vatsk`: Extracted tax ID
- `pokladnica`: Extracted cash register ID
- `transaction_id`: Transaction identifier
- `transaction_status`: Payment status
- `amount`: Payment amount (decimal)
- `currency`: Payment currency
- `integrity_hash`: Data integrity verification hash
- `end_to_end_id`: End-to-end transaction identifier
- `payload_received_at`: Timestamp from payload
- `created_at`: Database record timestamp

## Security Implementation

### Certificate Management Security
- **Temporary File Handling**: All certificate files written to temporary directory with unique session IDs
- **Automatic Cleanup**: Files deleted immediately after use to prevent data persistence
- **Memory Safety**: Certificate parsing uses secure libraries with proper error handling
- **No Persistent Storage**: Certificates never stored permanently on server
- **Session Isolation**: Each request uses unique identifiers to prevent cross-contamination

### Input Validation and Sanitization
- **XSS Prevention**: All user inputs sanitized using regex patterns to remove script tags and event handlers
- **IBAN Validation**: Multi-layer validation including format checking and mod-97 checksum verification
- **File Type Validation**: Certificate files validated for proper format and structure
- **Amount Validation**: Monetary amounts restricted to reasonable limits and digit-only input
- **SQL Injection Prevention**: All database queries use parameterized statements

### API Security
- **Mutual TLS (mTLS)**: All banking API communications use client certificate authentication
- **Certificate Validation**: Server certificates validated against trusted CA bundle
- **Secure Protocols**: TLS 1.2+ enforced for all encrypted communications
- **Error Handling**: Comprehensive error handling without sensitive information disclosure
- **Audit Logging**: All API calls logged with timestamps, IPs, and response codes

### Data Integrity
- **Hash Verification**: SHA-256 hashing for payment data integrity verification
- **Checksum Validation**: IBAN checksums verified using ISO 13616 standard
- **Message Authentication**: MQTT messages validated for authenticity
- **Replay Protection**: Transaction IDs provide uniqueness to prevent replay attacks

## Performance Optimizations

### Memory Management
- **QR Code Cleanup**: Data URLs revoked after use to prevent memory leaks
- **Timer Management**: All setTimeout/setInterval cleaned up in useEffect hooks
- **Log Rotation**: API logs limited to 20 entries with automatic rotation
- **State Optimization**: useCallback and useMemo used for expensive operations
- **File Cleanup**: Temporary files automatically deleted after processing

### API Efficiency
- **Retry Logic**: Exponential backoff retry mechanism for failed API calls
- **Connection Pooling**: HTTP connections reused where possible
- **Async Operations**: Non-blocking operations prevent UI freezing
- **Fire-and-Forget**: Database operations don't block API responses
- **Timeout Management**: Reasonable timeouts prevent hanging requests

### Database Performance
- **Indexed Queries**: Database queries optimized with proper indexing
- **Batch Operations**: Multiple database operations batched where possible
- **Connection Management**: Database connections properly managed and closed
- **Query Optimization**: Efficient queries with minimal data transfer
- **Caching Strategy**: Frequently accessed data cached appropriately

### Frontend Optimization
- **Code Splitting**: Components loaded on demand to reduce initial bundle size
- **Image Optimization**: QR codes generated at optimal sizes for display
- **State Management**: Efficient state updates to minimize re-renders
- **Event Debouncing**: Input events debounced to prevent excessive API calls
- **Lazy Loading**: Non-critical components loaded asynchronously

## UI/UX Optimizations

### Mobile-First Design
- **Responsive Layout**: Flexbox-based layouts adapt to all screen sizes
- **Touch Targets**: All interactive elements sized for touch interaction (minimum 44px)
- **Viewport Optimization**: Proper viewport meta tags prevent zoom issues
- **PWA Features**: Service worker registration for offline capability
- **Native Feel**: iOS and Android specific meta tags for app-like experience

### Accessibility Features
- **Semantic HTML**: Proper HTML5 semantic elements for screen readers
- **ARIA Labels**: Comprehensive ARIA attributes for assistive technologies
- **Keyboard Navigation**: Full keyboard accessibility for all interactive elements
- **Color Contrast**: WCAG AA compliant color contrast ratios
- **Screen Reader Support**: Hidden text for screen reader context
- **Focus Management**: Proper focus handling for modal dialogs and navigation

### User Experience Enhancements
- **Loading States**: Clear loading indicators for all async operations
- **Error Handling**: User-friendly error messages with actionable guidance
- **Progress Indicators**: Visual feedback for multi-step processes
- **Confirmation Dialogs**: Important actions require user confirmation
- **Auto-formatting**: IBAN and amount inputs automatically formatted
- **Validation Feedback**: Real-time validation with visual indicators

### Performance UX
- **Instant Feedback**: UI updates immediately for user actions
- **Optimistic Updates**: UI assumes success for better perceived performance
- **Skeleton Loading**: Content placeholders during data loading
- **Smooth Animations**: CSS transitions for state changes
- **Debounced Input**: Input validation debounced to prevent excessive processing

### Internationalization Considerations
- **Slovak Language**: Primary interface in Slovak for target market
- **Currency Formatting**: Proper EUR formatting with Slovak conventions
- **Date Formatting**: Slovak date format (DD.MM.YYYY) used throughout
- **Number Formatting**: European number formatting (comma as decimal separator)
- **Cultural Adaptation**: UI patterns adapted for Slovak banking practices

## Error Handling Strategy

### Client-Side Error Handling
- **Error Boundaries**: React error boundaries catch and display user-friendly errors
- **Validation Errors**: Real-time validation with specific error messages
- **Network Errors**: Offline detection and appropriate user messaging
- **Retry Mechanisms**: Automatic retry for transient failures
- **Graceful Degradation**: Core functionality maintained even with partial failures

### Server-Side Error Handling
- **Structured Logging**: Comprehensive error logging with context information
- **Error Classification**: Errors categorized by type and severity
- **Monitoring Integration**: Error tracking integrated with monitoring systems
- **Recovery Procedures**: Automatic recovery mechanisms where possible
- **User Communication**: Clear error messages without technical details

### Security Error Handling
- **Information Disclosure Prevention**: Error messages don't reveal system internals
- **Attack Detection**: Suspicious activity logged and monitored
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Comprehensive input validation with secure error responses
- **Audit Trail**: All security-related events logged for analysis

This comprehensive documentation covers all aspects of the NOP Web Test Client application, providing detailed technical information for developers, security considerations for auditors, and performance insights for optimization efforts.
