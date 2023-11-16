#!/usr/bin/env node
"use strict";

const express = require("express");
const expressWs = require("express-ws");
const path = require("path");
const { StringDecoder } = require("node:string_decoder");
const port = 9999;

function initWebsocket(ws, _) {
  ws.binaryType = "arraybuffer";
  ws.on("message", async function (message) {
    let messageData = new Uint8Array(message);
    const decoder = new StringDecoder("utf-8");
    const data = JSON.parse(decoder.write(messageData));
    const csv = await getCSV(data.fluxQuery, data.url, data.org, data.token);

    ws.send(Buffer.from(csv, "utf-8"));
  });
}

async function getCSV(fluxQuery, url, org, token) {
  let required = "";

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    if (url.length === 0) {
      required += "The URL cannot be empty.\n";
    } else {
      required +=
        "The URL must begin with `http://` or `https://`, depending on the configuration of your InfluxDB instance.\n";
    }
  }

  if (org.length === 0) {
    required += "The ORG cannot be empty.\n";
  }

  if (token.length === 0) {
    required += "The API Token cannot be empty.\n";
  }

  if (fluxQuery.length === 0) {
    required += "The Flux Query cannot be empty.\n";
  }

  if (required.length === 0) {
    try {
      const response = await fetch(url + "/api/v2/query?org=" + org, {
        method: "POST",
        body: fluxQuery,
        headers: {
          Authorization: "Token " + token,
          Accept: "application/csv",
          "Content-type": "application/vnd.flux",
        },
      });

      const data = (await response.text()).split("\n");

      let cleanedData = "";

      for (let i = 0; i < data.length; i++) {
        const line = data[i];
        if (line.length === 0) {
          continue;
        }
        if (line[0] === ",") {
          cleanedData += line.slice(1) + "\n";
        } else {
          cleanedData += line + "\n";
        }
      }

      return cleanedData;
    } catch (error) {
      return error.toString();
    }
  } else {
    return required;
  }
}

// Init the server
let app = express();
expressWs(app);

// Serve static files
app.use(express.static(path.join(__dirname, "./")));

// Serve functionality via WebSocket
app.ws("/ws", initWebsocket);

app.listen(port);

console.log("The website is available at http://localhost:" + port);
