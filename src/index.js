let ws;
let csvData;

document.addEventListener("DOMContentLoaded", async function () {
  ws = new WebSocket("ws://" + document.location.host + "/ws");
  ws.binaryType = "arraybuffer";
  ws.onmessage = handleMessage;

  document
    .getElementById("fluxQuerySubmit")
    .addEventListener("click", sendQueryToServer);
  document.getElementById("csvDownload").addEventListener("click", downloadCSV);
});

function handleMessage(message) {
  let decoder = new TextDecoder();

  csvData = decoder.decode(message.data);
  document.getElementById("csv").value = csvData;
}

function sendQueryToServer() {
  const url = document.getElementById("url").value;
  const org = document.getElementById("org").value;
  const token = document.getElementById("token").value;
  const fluxQuery = document.getElementById("fluxQuery").value;
  const encoder = new TextEncoder();
  const data = encoder.encode(
    JSON.stringify({
      url,
      org,
      token,
      fluxQuery,
    })
  );

  ws.send(data);
}

function downloadCSV() {
  const file = new Blob([csvData], { type: "csv" });
  const a = document.createElement("a");
  const url = URL.createObjectURL(file);

  a.href = url;
  a.download = document.getElementById("filename").value;
  document.body.appendChild(a);
  a.click();
  setTimeout(function () {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 0);
}
