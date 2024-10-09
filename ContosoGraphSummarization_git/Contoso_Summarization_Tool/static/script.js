// Chat

document.querySelectorAll('input[name="selected_book"]').forEach(function(radio) {  
    radio.addEventListener('change', function() {  
        const selectedBook = document.querySelector('input[name="selected_book"]:checked').value;  
        document.getElementById('selectedBookName_chat').innerText = selectedBook; // Update the selected book name  
    });  
});  
  
document.getElementById('sendButton').addEventListener('click', function() {  
    const question = document.getElementById('userQuestion').value;  
    const selectedBookElement = document.querySelector('input[name="selected_book"]:checked');
    if (!selectedBookElement) {
        alert("Please select a book.");
        return;
    }
    const selectedBook = selectedBookElement.value;
    
    const searchTypeElement = document.querySelector('input[name="searchType"]:checked');
    const searchType = searchTypeElement ? searchTypeElement.value : 'global';
    console.log('Selected search type:', searchType);
  
    if (question && selectedBook) {  
        // Clear previous response  
        document.getElementById('chatResponse').innerHTML = 'Response: ';   
        document.getElementById('contextReports').innerHTML = 'Citations: ';   
        document.getElementById('responsedetails').innerHTML = 'Response Details: ';   
          
        // Show the spinner  
        const spinner = document.getElementById('spinner1');  
        spinner.style.display = 'flex';  
  
        fetch('/chat', {  
            method: 'POST',  
            headers: {  
                'Content-Type': 'application/json',  
            },  
            body: JSON.stringify({ question: question, bookName: selectedBook , searchType: searchType }), // Include book name in the body  
        })  
        .then(response => {  
            if (!response.ok) {  
                throw new Error('Network response was not ok');  
            }  
            return response.json();  
        })  
        .then(data => {  
            // Hide the spinner after receiving response  
            spinner.style.display = 'none';   
  
            // Display the response in the chatResponse div  
            document.getElementById('chatResponse').innerHTML = data.answer; // Use innerHTML to render HTML  
  
            // Display the response details  
            if (data.response_details) {  
                const details = data.response_details;  
                document.getElementById('responsedetails').innerHTML = `  
                    Response Details:  
                    <ul>  
                        <li><strong>Completion Time:</strong> ${details.completion_time}</li>  
                        <li><strong>LLM Calls:</strong> ${details.llm_calls}</li>  
                        <li><strong>Prompt Tokens:</strong> ${details.prompt_tokens}</li>  
                    </ul>  
                `;  
            }  
  
            // Display the context reports as a table if they exist  
            if (data.context_data && data.context_data.reports) {  
                const reports = data.context_data.reports;  
  
                // Create a table  
                let tableHTML = '<h3>Citations:</h3><table><thead><tr>';  
                  
                // Create table headers  
                Object.keys(reports[0]).forEach(key => {  
                    tableHTML += `<th>${key}</th>`;  
                });  
                tableHTML += '</tr></thead><tbody>';  
  
                // Create table rows  
                reports.forEach(report => {  
                    tableHTML += '<tr>';  
                    Object.values(report).forEach(value => {  
                        tableHTML += `<td>${value}</td>`;  
                    });  
                    tableHTML += '</tr>';  
                });  
                tableHTML += '</tbody></table>';  
  
                document.getElementById('contextReports').innerHTML = tableHTML;  
            }  
        })  
        .catch(error => {  
            console.error('Error:', error);  
            // Hide the spinner in case of error  
            spinner.style.display = 'none';   
            alert('An error occurred while fetching the answer.'); // Notify user  
        });  
    } else {  
        alert("Please enter a question and select a book.");  
    }  
});  

// Book collapse and toggle


// Side Bar ------------- ------------------------------------------------
// Ensuring Side bar is collapsed by default
document.addEventListener('DOMContentLoaded', () => {  
    const sidebar = document.getElementById('sidebar');  
    sidebar.classList.add('collapsed');  
    sidebar.classList.remove('expanded');  

    const spans = sidebar.querySelectorAll('span');  
    spans.forEach(span => {  
        span.classList.add('hidden'); // Hide text in collapsed state  
    });  

    // Additionally, hide the book list and settings if needed  
    const bookList = document.getElementById('bookList');  
    const settings = document.getElementById('settings');  
    if (!bookList.classList.contains('hidden')) {  
        bookList.classList.add('hidden');  
    }  
    if (!settings.classList.contains('hidden')) {  
        settings.classList.add('hidden');  
    }  
}); 

// Side bar toggle

const toggleBtn = document.getElementById('toggleBtn');  
const sidebar = document.getElementById('sidebar');  
  
toggleBtn.addEventListener('click', () => {  
    const isCollapsed = sidebar.classList.toggle('collapsed');  
    sidebar.classList.toggle('expanded');  
  
    // Toggle visibility of text  
    const spans = sidebar.querySelectorAll('span');  
    spans.forEach(span => {  
        span.classList.toggle('hidden', isCollapsed);  
    });  
  
    // Check if the 'Select Book' or 'Settings' sections are expanded  
    if (isCollapsed) {  
        const bookList = document.getElementById('bookList');  
        const settings = document.getElementById('settings');  
  
        // Hide the 'Select Book' and 'Settings' if they are visible  
        if (!bookList.classList.contains('hidden')) {  
            bookList.classList.add('hidden');  
        }  
        if (!settings.classList.contains('hidden')) {  
            settings.classList.add('hidden');  
        }  
    }  
}); 

// Toggle Settings
function toggleSettings() {  
    const sidebar = document.getElementById('sidebar');  
    const settings = document.getElementById('settings');  
  
    // Check if the sidebar is collapsed  
    if (sidebar.classList.contains('collapsed')) {  
        // Expand the sidebar  
        sidebar.classList.remove('collapsed');  
        sidebar.classList.add('expanded');  
  
        // Show the text  
        const spans = sidebar.querySelectorAll('span');  
        spans.forEach(span => {  
            span.classList.remove('hidden');  
        });  
    }  
  
    // Toggle the visibility of the settings  
    if (settings.classList.contains('hidden')) {  
        settings.classList.remove('hidden');  
    } else {  
        settings.classList.add('hidden');  
    }  
}  

// Function to toggle sidebar and book list visibility  
function toggleBooks() {  
    const sidebar = document.getElementById('sidebar');  
    const bookList = document.getElementById('bookList');  
  
    // Check if the sidebar is collapsed  
    if (sidebar.classList.contains('collapsed')) {  
        // Expand the sidebar  
        sidebar.classList.remove('collapsed');  
        sidebar.classList.add('expanded');  
  
        // Show the text  
        const spans = sidebar.querySelectorAll('span');  
        spans.forEach(span => {  
            span.classList.remove('hidden');  
        });  
    }  
  
    // Toggle the visibility of the book list  
    if (bookList.classList.contains('hidden')) {  
        bookList.classList.remove('hidden');  
    } else {  
        bookList.classList.add('hidden');  
    }  
}  


document.getElementById('uploadForm').addEventListener('submit', function(event) {  
    event.preventDefault(); // Prevent the default form submission  
  
    const formData = new FormData(this);  
      
    fetch('/upload', {  
        method: 'POST',  
        body: formData  
    })  
    .then(response => {  
        if (response.ok) {  
            return response.json(); // Expecting JSON response  
        }  
        throw new Error('Network response was not ok.');  
    })  
    .then(data => {  
        // Update the list of uploaded books  
        const subbookList = document.getElementById('subbookList');  
        subbookList.innerHTML = ''; // Clear existing list  
  
        data.uploaded_books.forEach(book => {  
            const li = document.createElement('li');  
            li.innerHTML = `  
                <input type="radio" name="selected_book" value="${book}" id="${book}" />  
                <label for="${book}">${book}</label>  
            `;  
            subbookList.appendChild(li);  
        });  
  
        // Optionally, you can also reset the file input after upload  
        document.querySelector('input[type="file"]').value = '';  
    })  
    .catch(error => {  
        console.error('Error:', error);  
    });  
});  



// Summarize Button  
document.getElementById('summarizeButton').addEventListener('click', function(event) {  
    event.preventDefault(); // Prevent default behavior  
  
    const selectedBook = document.querySelector('input[name="selected_book"]:checked');  
    if (selectedBook) {  
        const bookName = selectedBook.value;  
        document.getElementById('selectedBookName').textContent = bookName;  
        console.log('Book selected:', bookName); // Debugging  
  
        // Show the spinner  
        const spinner = document.getElementById('spinner2');  
        spinner.style.display = 'flex';  

        // Start the timer  
        let startTime = Date.now();  
        const timerElement = document.getElementById('timer2');  
        timerElement.innerText = 'Time Taken: 0s';  
        timerElement.style.display = 'inline'; // Show the timer

        const timerInterval = setInterval(() => {  
            const elapsedMilliseconds = Date.now() - startTime;
            const elapsedMinutes = Math.floor(elapsedMilliseconds / 60000);
            const elapsedSeconds = Math.floor((elapsedMilliseconds % 60000) / 1000);
            timerElement.innerText = `Time : ${elapsedMinutes}m ${elapsedSeconds}s`;
            }, 1000);
  
        // Fetch the summary  
        fetch(`/fetch_summary?book=${bookName}`)  
            .then(response => {  
                if (!response.ok) {  
                    throw new Error('Book summary not available.');  
                }  
                return response.json();  
            })  
            .then(data => {  
                console.log('Summary data received:', data); // Debugging  
  
                document.querySelector('#summary .summary-title').innerText = data.title;  
                document.querySelector('#summary .summary-author').innerText = data.author;  
                document.querySelector('#summary .summary-synopsis').innerText = data.synopsis;  
                document.querySelector('#summary .summary-characters').innerText = data.characters;  
                document.querySelector('#summary .summary-reading-age').innerText = data.readingage;  
                document.querySelector('#summary .summary-audience').innerText = data.audience;  
                document.querySelector('#summary .summary-tone').innerText = data.tone;  
                document.querySelector('#summary .summary-themes').innerText = data.themes;  
                document.querySelector('#summary .summary-genres').innerText = data.genres;  
                document.querySelector('#summary .summary-reading-guides').innerHTML = data.readingguides;  
                document.querySelector('#summary .summary-teaching-guides').innerHTML = data.teachingguides;  
                document.querySelector('#summary .summary-bookindex').innerHTML = data.bookindex;  
                document.querySelector('#summary .summary-singletagline').innerText = data.single_tagline;  
                document.querySelector('#summary .summary-fullplotsummary').innerText = data.full_plot_summary;  
                document.querySelector('#summary .summary-date').innerText = data.update_date;  
  
                // Hide the spinner after receiving response  
                spinner.style.display = 'none';  
                clearInterval(timerInterval); // Stop the timer 
    
                // Get the final elapsed time  
                const elapsedMilliseconds = Date.now() - startTime;
                const elapsedMinutes = Math.floor(elapsedMilliseconds / 60000);
                const elapsedSeconds = Math.floor((elapsedMilliseconds % 60000) / 1000);
                timerElement.innerText = `Time : ${elapsedMinutes}m ${elapsedSeconds}s`; // Show final time
            })  
            .catch(error => {  
                console.error('Error:', error);  
                alert('An error occurred while fetching the summary.'); // Notify user  
                // Hide the spinner in case of error  
                spinner.style.display = 'none';  
                clearInterval(timerInterval); // Stop the timer
                const elapsedMilliseconds = Date.now() - startTime;
                const elapsedMinutes = Math.floor(elapsedMilliseconds / 60000);
                const elapsedSeconds = Math.floor((elapsedMilliseconds % 60000) / 1000);
                timerElement.innerText = `Time : ${elapsedMinutes}m ${elapsedSeconds}s`; // Show final time 
                alert('An error occurred while fetching the answer.'); // Notify user of error    
            });  
    } else {  
        alert("Please select a book to summarize.");  
    }  
});  


// Toggle Summary

function toggleSummary() {  
    var summaryText = document.getElementById("summaryText");  
    var toggleButton = document.getElementById("toggleButton");  

    if (summaryText.style.display === "none") {  
        summaryText.style.display = "block";  
        toggleButton.innerText = "-"; // Change button text to "-"  
    } else {  
        summaryText.style.display = "none";  
        toggleButton.innerText = "+"; // Change button text to "+"  
    }  
}  

function toggleSummary_st() {  
    var summaryText = document.getElementById("summaryText_st");  
    var toggleButton = document.getElementById("toggleButton_st");  

    if (summaryText.style.display === "none") {  
        summaryText.style.display = "block";  
        toggleButton.innerText = "-"; // Change button text to "-"  
    } else {  
        summaryText.style.display = "none";  
        toggleButton.innerText = "+"; // Change button text to "+"  
    }  
}  

function toggleSummary_bi() {  
    var summaryText = document.getElementById("summaryText_bi");  
    var toggleButton = document.getElementById("toggleButton_bi");  

    if (summaryText.style.display === "none") {  
        summaryText.style.display = "block";  
        toggleButton.innerText = "-"; // Change button text to "-"  
    } else {  
        summaryText.style.display = "none";  
        toggleButton.innerText = "+"; // Change button text to "+"  
    }  
} 

function toggleSummary_tg() {  
    var summaryText = document.getElementById("summaryText_tg");  
    var toggleButton = document.getElementById("toggleButton_tg");  

    if (summaryText.style.display === "none") {  
        summaryText.style.display = "block";  
        toggleButton.innerText = "-"; // Change button text to "-"  
    } else {  
        summaryText.style.display = "none";  
        toggleButton.innerText = "+"; // Change button text to "+"  
    }  
}

function toggleSummary_rg() {  
    var summaryText = document.getElementById("summaryText_rg");  
    var toggleButton = document.getElementById("toggleButton_rg");  

    if (summaryText.style.display === "none") {  
        summaryText.style.display = "block";  
        toggleButton.innerText = "-"; // Change button text to "-"  
    } else {  
        summaryText.style.display = "none";  
        toggleButton.innerText = "+"; // Change button text to "+"  
    }  
}

function toggleSummary_gen() {  
    var summaryText = document.getElementById("summaryText_gen");  
    var toggleButton = document.getElementById("toggleButton_gen");  

    if (summaryText.style.display === "none") {  
        summaryText.style.display = "block";  
        toggleButton.innerText = "-"; // Change button text to "-"  
    } else {  
        summaryText.style.display = "none";  
        toggleButton.innerText = "+"; // Change button text to "+"  
    }  
}

function toggleSummary_theme() {  
    var summaryText = document.getElementById("summaryText_theme");  
    var toggleButton = document.getElementById("toggleButton_theme");  

    if (summaryText.style.display === "none") {  
        summaryText.style.display = "block";  
        toggleButton.innerText = "-"; // Change button text to "-"  
    } else {  
        summaryText.style.display = "none";  
        toggleButton.innerText = "+"; // Change button text to "+"  
    }  
}

function toggleSummary_tone() {  
    var summaryText = document.getElementById("summaryText_tone");  
    var toggleButton = document.getElementById("toggleButton_tone");  

    if (summaryText.style.display === "none") {  
        summaryText.style.display = "block";  
        toggleButton.innerText = "-"; // Change button text to "-"  
    } else {  
        summaryText.style.display = "none";  
        toggleButton.innerText = "+"; // Change button text to "+"  
    }  
}

function toggleSummary_aud() {  
    var summaryText = document.getElementById("summaryText_aud");  
    var toggleButton = document.getElementById("toggleButton_aud");  

    if (summaryText.style.display === "none") {  
        summaryText.style.display = "block";  
        toggleButton.innerText = "-"; // Change button text to "-"  
    } else {  
        summaryText.style.display = "none";  
        toggleButton.innerText = "+"; // Change button text to "+"  
    }  
}

function toggleSummary_ra() {  
    var summaryText = document.getElementById("summaryText_ra");  
    var toggleButton = document.getElementById("toggleButton_ra");  

    if (summaryText.style.display === "none") {  
        summaryText.style.display = "block";  
        toggleButton.innerText = "-"; // Change button text to "-"  
    } else {  
        summaryText.style.display = "none";  
        toggleButton.innerText = "+"; // Change button text to "+"  
    }  
}

function toggleSummary_char() {  
    var summaryText = document.getElementById("summaryText_char");  
    var toggleButton = document.getElementById("toggleButton_char");  

    if (summaryText.style.display === "none") {  
        summaryText.style.display = "block";  
        toggleButton.innerText = "-"; // Change button text to "-"  
    } else {  
        summaryText.style.display = "none";  
        toggleButton.innerText = "+"; // Change button text to "+"  
    }  
}

function toggleSummary_syn() {  
    var summaryText = document.getElementById("summaryText_syn");  
    var toggleButton = document.getElementById("toggleButton_syn");  

    if (summaryText.style.display === "none") {  
        summaryText.style.display = "block";  
        toggleButton.innerText = "-"; // Change button text to "-"  
    } else {  
        summaryText.style.display = "none";  
        toggleButton.innerText = "+"; // Change button text to "+"  
    }  
}

// Export summary

function exportSummary() {  
    const bookName = document.getElementById('selectedBookName').innerText; // Get the book name  
    const url = `/export_summary/${bookName}`; // Construct the URL  

    // Trigger a download  
    window.location.href = url;  
}  
 
// Collapse chat div to right side of main div. expand summary div to take up released space 
//on click of toggleButton_chat button

let chatVisible = true; // State variable to track visibility  
  
function toggleChat() {  
    const chatDiv = document.getElementById('chat');  
    //const chatCollapsed = document.getElementById('chat-collapsed');  
    const toggleButton = document.getElementById('toggleButton_chat');  
  
    if (chatVisible) {  
        chatDiv.classList.add('hidden'); // Hide the chat  
        //chatCollapsed.style.display = 'block'; // Show vertical text  
        toggleButton.textContent = "Show Chat"; // Change button text  
    } else {  
        chatDiv.classList.remove('hidden'); // Show the chat  
        //chatCollapsed.style.display = 'none'; // Hide vertical text  
        toggleButton.textContent = "Hide Chat"; // Change button text back  
    }  
  
    chatVisible = !chatVisible; // Toggle the state  
}




