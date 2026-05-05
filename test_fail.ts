import fetch from 'node-fetch';

async function test() {
  const chargilyKey = 'invalid_key';
  const response = await fetch("https://pay.chargily.net/test/api/v2/checkouts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${chargilyKey}`
    },
    body: JSON.stringify({
      amount: 700,
      currency: "dzd",
      success_url: "http://localhost:3000/success",
      failure_url: "http://localhost:3000/failure",
      metadata: [{ user_id: 'test' }]
    })
  });
  console.log('Status', response.status);
  try {
    const text = await response.text();
    console.log("Text:", text);
    const data = JSON.parse(text);
    console.log(data);
  } catch(e: any) {
    console.error("error:", e.message);
  }
}
test();
