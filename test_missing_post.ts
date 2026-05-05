import fetch from 'node-fetch';

async function test() {
  const response = await fetch("http://localhost:3000/some-missing-post", {
    method: "POST"
  });
  const text = await response.text();
  console.log("Status:", response.status);
  console.log("Text:", text);
}
test();
