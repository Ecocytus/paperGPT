// Load the PDF.js library
var pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = '//mozilla.github.io/pdf.js/build/pdf.worker.js';
const FirstTab = "ChatGPT, please confirm that you are ready to receive the paper and summarize it accordingly. When you receive the paper, please wait for further instructions before summarizing it, and do not comment on it until you are instructed to do so, for example you receive: \"Chatgpt, all pages are given.\". Please confirm that you understand these instructions by replying: \"Understood.\""

// Handle file input change event
document.getElementById('pdf-file').addEventListener('change', function (event) {
  var file = event.target.files[0];

  // Read the contents of the file as binary data
  var reader = new FileReader();
  reader.readAsArrayBuffer(file);
  reader.onload = function () {
    var binaryData = new Uint8Array(reader.result);

    // Load the PDF file
    var loadingTask = pdfjsLib.getDocument({ data: binaryData });
    loadingTask.promise.then(function (pdf) {
      // Get the number of pages in the PDF
      var numPages = pdf.numPages;
      var pagePromises = [];

      // Extract text content from each page
      for (var i = 1; i <= numPages; i++) {
        pagePromises.push(pdf.getPage(i).then(function (page) {
          return page.getTextContent().then(function (textContent) {
            return textContent.items.map(function (item) {
              return item.str;
            }).join('');
          });
        }));
      }

      // Wait for all promises to resolve and concatenate text content
      Promise.all(pagePromises).then(function (pages) {
        var text = pages.join('');
        var maxLength = 3900; // 500 words or 4000 tokens
        var listOfText = [FirstTab];
        var start = 0;
        var end = maxLength;

        // Split the text into an array of strings with a maximum length of 500 words or 4000 tokens
        while (start < text.length) {
          var chunk = text.substring(start, end);
          listOfText.push(chunk);
          start = end;
          end = end + maxLength;
        }
        listOfText[listOfText.length - 1] += "Chatgpt, all pages are given.";

        console.log(listOfText);

        // Clear previous text blocks
        document.getElementById('text-blocks').innerHTML = '';

        // Create a text block for each string in listOfText
        listOfText.forEach(function (text, index) {
          var preview = text.substring(0, 50) + '...';
          var textBlock = document.createElement('div');
          textBlock.classList.add('text-block');
          textBlock.innerHTML = `
            <div class="text-block-preview">${preview}</div>
            <button class="copy-button" text-index="${index}">Copy</button>
          `;
          document.getElementById('text-blocks').appendChild(textBlock);
        });

        // Handle copy button click event
        document.querySelectorAll('.copy-button').forEach(function (button) {
          button.addEventListener('click', function (event) {
            var text_index = event.target.getAttribute('text-index');
            var text = listOfText[Number(text_index)];
            navigator.clipboard.writeText(text).then(function () {
                event.target.parentNode.style.backgroundColor = 'lightgreen';
                event.target.style.backgroundColor = 'green';
                event.target.style.cursor = 'default';
            }, function (error) {
              console.error(error);
            });
          });
        });

      });
    }, function (reason) {
      console.error(reason);
    });
  };
});


function cutText(text, limit) {
  var tokens = text.split(' ');
  var cutText = '';
  for (var i = 0; i < tokens.length; i++) {
    if ((cutText + tokens[i]).length <= limit) {
      cutText += (tokens[i] + ' ');
    } else {
      break;
    }
  }
  return cutText;
}