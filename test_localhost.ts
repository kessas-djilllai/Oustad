import fetch from 'node-fetch';

async function test() {
  const response = await fetch("http://localhost:3000/api/create-checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      success_url: "http://localhost:3000/success",
      failure_url: "http://localhost:3000/failure",
      user_id: 'test'
    })
  });
  const text = await response.text();
  console.log("Status from localhost:", response.status);
  console.log("Raw from localhost:", text);
}
test();
