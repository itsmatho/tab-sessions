var curr_session, saved_sessions;
var session_count = 0;

var session_option_elements = {};
var sessions_list = document.querySelector('.sessions-list');
var save_btn = document.querySelector('.save');

/* Add event listener to button */
save_btn.addEventListener('click', saveCurrentSession);

/* Generic error logger */
function onError(error) {
  console.log('Promise error: ' + error);
}

/* Store tab urls of current window */
function storeCurrentSession(session_window) {
  // Get array of urls
  curr_session = session_window.tabs.map( (tab) => {return tab.url;});
}

/* Fetch current window into store */
function fetchCurrentSession() {
  browser.windows.getCurrent({populate: true}).then(storeCurrentSession, onError);
}

/* Store saved sessions from storage */
function storeSavedSessions(sessions) {
  saved_sessions = sessions;
}

/* Fetch all of the saved tab sessions */
function fetchSavedSessions() {
  browser.storage.local.get('sessions').then( (sessions) => {
    sessions = sessions['sessions']

    // If sessions don't exist, create empty object
    if(!sessions) {
      sessions = {};
    } else {
      var session_keys = Object.keys(sessions);
      for(let session_key of session_keys) {
        displaySessionOption(session_key, sessions[session_key]);
      }
    }

    session_count = Object.keys(sessions).length;
    storeSavedSessions(sessions);
    console.log("Count: " + session_count);
  }, onError);
}

/* Start input session in a new window */
function startSession(session) {
  if(!session) {
    console.log("Error: session to start does not exist");
    return;
  }
  console.log("Starting...");
  console.log(session);

  browser.windows.create({url: session});
}

/* Delete session by input session name */
function deleteSession(session_name) {
  if(!saved_sessions[session_name]) return;

  session_count--;

  var elem = session_option_elements[session_name];
  elem.parentNode.removeChild(elem);
  delete session_option_elements[session_name];
  delete saved_sessions[session_name];
  browser.storage.local.set({
    'sessions': saved_sessions
  });
}

/* Display the window session options in the popup */
function displaySessionOption(session_name, session) {
  var session_option = document.createElement('div');
  session_option_elements[session_name] = session_option;
  session_option.setAttribute('class', 'session');

  var session_header = document.createElement('div');
  session_header.setAttribute('class', 'header');
  session_header.textContent = session_name;

  //var urls_btn = document.createElement('button');
  //var edit_btn = document.createElement('button');
  var start_btn = document.createElement('button');
  var delete_btn = document.createElement('button');

  //urls_btn.addEventListener('click', () => {showUrls(session);});
  console.log("session displayed");
  console.log(session);
  start_btn.addEventListener('click', () => {startSession(session);});
  start_btn.textContent = 'Start session';
  start_btn.setAttribute('class', 'start');
  delete_btn.addEventListener('click', () => {deleteSession(session_name);});
  delete_btn.textContent = 'Delete session';
  delete_btn.setAttribute('class', 'delete');

  var session_separator = document.createElement('div');
  session_separator.setAttribute('class', 'panel-section-separator');
  
  session_option.appendChild(session_separator);
  session_option.appendChild(session_header);
  session_option.appendChild(start_btn);
  session_option.appendChild(delete_btn);

  sessions_list.appendChild(session_option);
}

/* Save current tab session by given name into local storage */
function saveCurrentSession() {
  if(!curr_session) {
    console.log("Error: Current window undefined");
    return;
  }

  if(!saved_sessions) {
    console.log("Error: Saved sessions undefined");
    return;
  }


  session_count++;

  // Give default session name for current session by linear probing
  var session_number = session_count;
  var name = 'Session ';
  while(saved_sessions[name + session_number]) session_number++;
  name += session_number;
  console.log("Number: " + session_number);

  if(!saved_sessions[name])
    displaySessionOption(name, curr_session);

  saved_sessions[name] = curr_session;

  browser.storage.local.set({
    'sessions': saved_sessions
  });
}

// Asynchronous fetches
console.log('fetching current window sesh');
fetchCurrentSession();
console.log('fetching all window seshes');
fetchSavedSessions();
