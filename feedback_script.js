// 1. KONFIGURASI
const SHEET_NAME = "Feedback";
const WEBHOOK_URL = "";

/**
 * Menerima data dari aplikasi/web (POST)
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    
    let rawImage = data.image;
    let finalArray = [];

    // Normalisasi Data Image menjadi Array
    if (Array.isArray(rawImage)) {
      finalArray = rawImage;
    } else if (typeof rawImage === "string") {
      finalArray = rawImage.split(",").map(s => s.trim());
    }

    // Ambil URL mentah untuk Webhook
    let imgUrl1 = finalArray[0] ? finalArray[0].toString().replace(/[\[\]"]/g, "").trim() : "";
    let imgUrl2 = finalArray[1] ? finalArray[1].toString().replace(/[\[\]"]/g, "").trim() : "";
    let imgUrl3 = finalArray[2] ? finalArray[2].toString().replace(/[\[\]"]/g, "").trim() : "";

    // Susun formula IMAGE untuk Spreadsheet
    let img1 = imgUrl1 ? '=IMAGE("' + imgUrl1 + '")' : "";
    let img2 = imgUrl2 ? '=IMAGE("' + imgUrl2 + '")' : "";
    let img3 = imgUrl3 ? '=IMAGE("' + imgUrl3 + '")' : "";

    // KIRIM KE GOOGLE CHAT
    const chatThreadUrl = sendToGoogleChat(data, [imgUrl1, imgUrl2, imgUrl3]);    

    // Simpan ke Spreadsheet
    sheet.appendRow([
      new Date(), 
      chatThreadUrl,
      data.userId || "N/A",
      data.name || "Anonymous",
      data.source,
      img1, // Kolom D
      img2, // Kolom E
      img3, // Kolom F
      data.url || "",
      data.type || "General",
      data.message || ""
    ]);

    
    return response({"status": "success", "message": "Data saved and sent to Chat"});
  } catch (error) {
    return response({"status": "error", "message": error.toString()});
  }
}

/**
 * Fungsi untuk mengirim notifikasi Card ke Google Chat
 * @return {string} URL thread Google Chat
 */
function sendToGoogleChat(data, images) {
  try {
    let validImages = images.filter(url => url && url.startsWith("http"));
    
    // Setup Widgets
    let widgets = [
      {
        "decoratedText": {
          "topLabel": "User Info",
          "text": "<b>" + (data.name || "Anonymous") + "</b> (" + (data.userId || "N/A") + " - " + (data.source || "N/A") +")",
          "wrapText": true
        }
      },
      {
        "decoratedText": {
          "topLabel": "Source URL",
          "text": data.url || "No URL provided",
          "wrapText": true,
        }
      },
      {
        "decoratedText": {
          "topLabel": "Message",
          "text": data.message || "No message content",
          "wrapText": true
        }
      }
    ];

    validImages.forEach(url => {
      widgets.push({
        "image": { 
          "imageUrl": url,
          "onClick": {
            "openLink": {
              "url": url 
            }
          }
        }
      });
    });

    const cardPayload = {
      "cards_v2": [{
        "card_id": "feedback_card",
        "card": {
          "header": {
            "title": "New Feedback: " + (data.type || "Report"),
            "subtitle": Utilities.formatDate(new Date(), "GMT+7", "dd MMM yyyy HH:mm"),
            "imageUrl": "https://cdn-icons-png.flaticon.com/512/4910/4910913.png"
          },
          "sections": [{ "widgets": widgets }]
        }
      }]
    };

    const options = {
      "method": "post",
      "contentType": "application/json",
      "payload": JSON.stringify(cardPayload),
      "muteHttpExceptions": true
    };

    // Eksekusi Webhook
    const res = UrlFetchApp.fetch(WEBHOOK_URL, options);
    const resContent = res.getContentText();
    const resJson = JSON.parse(resContent);
    
    console.log("Chat Response: " + resContent);

    // LOGIKA PEMBENTUKAN URL THREAD
    if (resJson && resJson.thread && resJson.thread.name) {
      // Input: spaces/AAQA0ZTfy_Y/threads/K7sLw8qWRoQ
      const parts = resJson.thread.name.split('/');
      const spaceId = parts[1]; // AAQA0ZTfy_Y
      const threadId = parts[3]; // K7sLw8qWRoQ
      
      // Output Format: https://chat.google.com/app/chat/SPACE_ID/topic/THREAD_ID
      return `https://chat.google.com/app/chat/${spaceId}/topic/${threadId}`;
    }

    return "No Thread URL";

  } catch (err) {
    console.error("Error in sendToGoogleChat: " + err.toString());
    return "Error: " + err.toString();
  }
}

/**
 * Mengambil data dari Spreadsheet (GET)
 */
function doGet() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const range = sheet.getDataRange();
    const values = range.getValues();      
    const formulas = range.getFormulas();  
    const data = [];
    
    for (var i = 1; i < values.length; i++) {
      let rowValues = values[i];
      let rowFormulas = formulas[i];
      
      const imageColumns = [5, 6, 7]; // kolom D, E, F
      const images = [];

      imageColumns.forEach(colIndex => {
        let formula = rowFormulas[colIndex];
        let rawUrl = "";

        if (formula && formula.includes("IMAGE")) {
          let match = formula.match(/=IMAGE\("([^"]+)"\)/i);
          if (match && match[1]) rawUrl = match[1];
        } else if (rowValues[colIndex] && typeof rowValues[colIndex] === 'string') {
          rawUrl = rowValues[colIndex];
        }

        if (rawUrl) {
          // Ambil hanya bagian setelah "?path="
          let pathMatch = rawUrl.match(/\?path=(.+)$/);
          if (pathMatch && pathMatch[1]) {
            rawUrl = pathMatch[1]; // ambil bagian path saja
          }

          images.push(rawUrl);
        }
      });
      
      data.push({
        "timestamp": rowValues[0],
        "userId":    rowValues[2],
        "name":      rowValues[3],
        "source": rowValues[4],
        "image":     images,
        "url":       rowValues[8],
        "category":  rowValues[9],
        "message":   rowValues[10],
        "type":      rowValues[11] || "",
        "reply":     rowValues[12] || ""
      });
    }
    
    return response(data);
  } catch (error) {
    return response({"status": "error", "message": error.toString()});
  }
}

function response(content) {
  return ContentService.createTextOutput(JSON.stringify(content))
    .setMimeType(ContentService.MimeType.JSON);
}``