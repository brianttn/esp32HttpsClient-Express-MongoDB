#include <WiFiClientSecure.h>
#include <DHT.h>
#include <ArduinoJson.h>

/* - - - - - -   DHT11 Variables   - - - - - - */
#define DHT_PIN 4           // 「Digital」 pin connected to the DHT sensor
#define DHT_TYPE DHT11      // Assign the sensor type

DHT dht(DHT_PIN, DHT_TYPE);     // Initialize DHT sensor
float humVal;
float tempVal;

/* - - - - - -   WiFi Variables   - - - - - - */
const char* SSID = "Your SSID";
const char PWD[] = "Your Password";

/* - - - - - -   Time variables   - - - - - - */
unsigned long previousMillis = 0;   // The time when the last https request was sent
const long interval = 5000;         // Request sending interval

/* - - - - - -   Railway Variables   - - - - - - */
const char* SERVER_DOMAIN = "Your deployment platform domain";      // The domain of the deployment platform
const uint16_t HTTPS_PORT = 443;      // Server https port

/* = = = = = = = = = = = =   HTTPS variables   = = = = = = = = = = = = */
/* - - - Create a new https client Object - - - */
WiFiClientSecure client;

/* - - - - - -   HTTPS request headers variables   - - - - - - */
const String REQ_METHOD = "POST";
const String APP_URL = "https://esp32-temp-humid-mongodb-production.up.railway.app";
const String PATH_NAME = "/data";
const String HTTP_PROTOCOL = "HTTP/1.1";

String httpsReqStr = REQ_METHOD + " " + APP_URL + PATH_NAME + " " + HTTP_PROTOCOL;

/* - - - - - -   railwayApp.crt   - - - - - - */
const char* root_ca =
  "-----BEGIN CERTIFICATE-----\n"
  "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\n"
  "-----END CERTIFICATE-----\n";


/* = = = = = = = = = = = =   Subroutines   = = = = = = = = = = = = */
void dhtSenseProc() {
  humVal = dht.readHumidity();          // Read Humidity
  tempVal = dht.readTemperature();      // Read temperature as Celsius

  if (isnan(humVal) || isnan(tempVal)) {
    Serial.println(F("Failed to read from DHT sensor!"));
  }
}

void makeRequest() {
  /* - - - - - - Create json format data - - - - - - */
  DynamicJsonDocument doc(128);
  doc["temp"] = tempVal;
  doc["humid"] = humVal;

  String jsonData;
  serializeJson(doc, jsonData);

  /* - - - Make a https post request：Send the request headers - - - */
  client.println(httpsReqStr);
  client.println("Connection: Keep-Alive");
  client.println("Content-Type: application/json");
  client.print("Content-Length: ");
  client.println(jsonData.length());
  client.println();
  client.print(jsonData);

  /* - - - - - - Waiting for the server's response - - - - - - */
  while (client.connected() || client.available()) {
    // Dumping the response headers
    String line = client.readStringUntil('\n');

    if (line == "\r") {
      Serial.print("Received server response => ");
      String resBody = client.readStringUntil('\n');
      Serial.println(resBody);
      break;
    }
  }
}

void setup() {
  /* - - - - - - Initialize Serial - - - - - - */
  Serial.begin(115200);
  delay(100);

  /* - - - Activate DHT sensor - - - */
  dht.begin();

  /* - - - - - - WiFi Connection - - - - - - */
  Serial.print("Connecting to SSID：");
  Serial.println(SSID);
  WiFi.begin(SSID, PWD);

  Serial.println("");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }

  Serial.print("\nConnected to ");
  Serial.println(SSID);
  Serial.print("IP address：");
  Serial.println(WiFi.localIP());

  /* - - - - - - Set CA certificate - - - - - - */
  client.setCACert(root_ca);

  /* - - - - - - - - - Connect to server - - - - - - - - - */
  Serial.println("\nStart connecting to server...");
  if (!client.connect(SERVER_DOMAIN, HTTPS_PORT)) {
    Serial.println("Connection failed!!");
  } else {
    Serial.println("Connected to server!!");
  }
}

void loop() {
  unsigned long currentMillis = millis();

  if ((previousMillis == 0) || (currentMillis - previousMillis >= interval)) {
    previousMillis = currentMillis;

    dhtSenseProc();
    makeRequest();
  }
}
