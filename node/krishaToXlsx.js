
const axios = require('axios');
const xlsx = require('xlsx');
const path = require('path');

const headers = {
  "accept": "application/json, text/plain, */*",
  "accept-language": "en-US,en;q=0.9,ru-RU;q=0.8,ru;q=0.7",
  "cache-control": "no-cache",
  "pragma": "no-cache",
  "sec-ch-ua": "\"Not.A/Brand\";v=\"8\", \"Chromium\";v=\"114\", \"Google Chrome\";v=\"114\"",
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": "\"Windows\"",
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  "x-requested-with": "XMLHttpRequest",
  "cookie": "krishauid=c6a5d6dae765e9b02dc4491924b3389a27dc9345; ssaid=122d0ae0-e821-11ed-a2dd-b55cb778070f; _ga=GA1.2.122d0ae0-e821-11ed-a2dd-b55cb778070f; uxs_uid=124fd520-e821-11ed-ab40-8750a883b187; tutorial=%7B%22advPage%22%3A%22viewed%22%7D; ksq_region=105; hist_region=105; ssaid=122d0ae0-e821-11ed-a2dd-b55cb778070f; re2Qqt9pLYYRJ8Br=1; krssid=37e4qh3l31olevgrurtotkm4i7; nps=1; kr_cdn_host=//astps-kz.kcdn.online; __tld__=null",
  "Referer": "https://krisha.kz/a/show/682319599",
  "Referrer-Policy": "strict-origin-when-cross-origin"
}

// Parse the list parameter from the URL
const url = process.argv[2];
const params = new URL(url).searchParams;
const idList = params.get('list\\').split(',');

// Create an Excel workbook and worksheet
const workbook = xlsx.utils.book_new();
const worksheet = xlsx.utils.json_to_sheet([]);

// Process each ID sequentially with delay
function processIdsSequentially() {
  const data = []; // Array to store data

  function processId(id) {
    return new Promise((resolve, reject) => {
      // Make the GET request to retrieve the phones
      axios
        .get(`https://krisha.kz/a/ajaxPhones?id=${id}`, {
          headers: headers,
        })
        .then(response => {
          console.log('Response for the id', id, response);
          // Extract the phones from the response
          const phones = response.data.phones.map(phone => phone.replace(/\s/g, ''));

          // Add the data to the array
          phones.forEach(phone => {
            data.push({ entry: `https://krisha.kz/a/show/${id}`, phones: phone });
          });

          console.log(`Data for ID ${id} processed successfully. Phones:`, phones);

          // Generate a random delay between 1 to 3 seconds
          const delay = Math.floor(Math.random() * 2000) + 1000;
          setTimeout(() => {
            resolve();
          }, delay);
        })
        .catch(error => {
          console.error(`Error processing ID ${id}: ${error.message}`);
          reject(error);
        });
    });
  }

  // Iterate over IDs sequentially
  let promiseChain = Promise.resolve();
  for (let i = 0; i < idList.length; i++) {
    promiseChain = promiseChain.then(() => processId(idList[i]));
  }

  return promiseChain.then(() => {
    console.log('Data in promise resolve:', data);
    return data;
  });
}

// Process IDs sequentially with delay
processIdsSequentially()
  .then(data => {
    // Add the data to the worksheet
    xlsx.utils.sheet_add_json(worksheet, data, { skipHeader: true, origin: -1 });

    // Add the worksheet to the workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet 1');

    // Save the workbook to a file
    const scriptDir = path.dirname(process.argv[1]);
    const outputFile = path.join(scriptDir, 'output.xlsx');
    xlsx.writeFile(workbook, outputFile);
    console.log(`Data written to ${outputFile}`);
  })
  .catch(error => console.error(`Error processing IDs: ${error.message}`));
