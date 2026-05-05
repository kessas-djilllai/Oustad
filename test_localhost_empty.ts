import fetch from 'node-fetch';

async function test() {
  const response = await fetch("http://localhost:3000/api/create-checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      amount: 700,
      success_url: "http://localhost:3000/success",
      failure_url: "http://localhost:3000/failure",
      user_id: ''
    })
  });
  const text = await response.text();
  console.log("Status:", response.status);
  console.log("Text:", text);
}
test();
