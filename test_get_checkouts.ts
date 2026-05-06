import fetch from 'node-fetch';

async function test() {
  const chargilyKey = process.env.CHARGILY_SECRET_KEY;
  if (!chargilyKey) {
    console.log("No key"); return;
  }
  const isTestKey = chargilyKey.startsWith('test_');
  const baseUrl = isTestKey ? "https://pay.chargily.net/test/api/v2" : "https://pay.chargily.net/api/v2";

  console.log("Fetching from:", `${baseUrl}/checkouts`);
  const response = await fetch(`${baseUrl}/checkouts`, {
    headers: { "Authorization": `Bearer ${chargilyKey}` }
  });
  const data = await response.json();
  console.log("Status:", response.status);
  console.log("Data total:", data.data?.length);
  if(data.data?.length > 0) {
      console.log("First item metadata:", data.data[0].metadata);
      console.log("First item status:", data.data[0].status);
  }
}
test();
