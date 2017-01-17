var curr_session, saved_sessions;
var session_count = 0;
var editing = false;

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
  }, onError);
}

/* Start input session in a new window */
function startSession(session) {
  if(!session) {
    console.log("Error: session to start does not exist");
    return;
  }

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

/* Append the window session to the session list in the popup */
function displaySessionOption(session_name, session) {
  var session_option = document.createElement('div');
  session_option_elements[session_name] = session_option;
  session_option.setAttribute('class', 'session');

  var header_error_element = document.createElement('div');
  header_error_element.setAttribute('class', 'edit-error');
  header_error_element.textContent = "The session name already exists! Please use another name.";

  var session_header = document.createElement('div');
  session_header.setAttribute('class', 'header');
  session_header.textContent = session_name;

  var session_header_container = document.createElement('div');
  session_header_container.setAttribute('class', 'header-container');

  session_header_container.appendChild(session_header);

  var session_header_edit_btn_container = document.createElement('div');
  session_header_edit_btn_container.setAttribute('class', 'edit-btn-container');

  var session_header_edit_btn = document.createElement('button');
  session_header_edit_btn.setAttribute('class', 'header-edit');
  session_header_edit_btn.textContent = "Edit";

  var session_header_canceledit_btn = document.createElement('button');
  session_header_canceledit_btn.setAttribute('class', 'header-edit-cancel');
  session_header_canceledit_btn.textContent = "Cancel";

  session_header_edit_btn_container.appendChild(session_header_edit_btn);

  // Event listener for editing the session name
  session_header_edit_btn.addEventListener('click', () => {
    // Make sure that the new name for the session doesn't already exist
    if(editing && session_header.textContent !== session_name && saved_sessions[session_header.textContent]) {
      session_header_container.appendChild(header_error_element);
    } else {
      session_header.contentEditable = !session_header.isContentEditable;
      session_header_edit_btn.textContent = session_header.isContentEditable ? "Done" : "Edit";

      // If done editing, set the new name
      if(editing && session_header.textContent !== session_name) {
        session_option_elements[session_header.textContent] = session_option_elements[session_name];
        if(!(delete session_option_elements[session_name])) console.log(session_name + " option element property not deleted!");
        saved_sessions[session_header.textContent] = saved_sessions[session_name];
        if(!(delete saved_sessions[session_name])) console.log(session_name + " saved session not deleted!");

        session_name = session_header.textContent;
        session = saved_sessions[session_name];
        browser.storage.local.set({
          'sessions': saved_sessions
        });
      }

      editing = !editing;
      if(header_error_element.parentNode)
        header_error_element.parentNode.removeChild(header_error_element);
    }
  });

  var start_btn = document.createElement('button');
  start_btn.addEventListener('click', () => {startSession(session);});
  start_btn.textContent = 'Start session';
  start_btn.setAttribute('class', 'start');

  var delete_btn = document.createElement('button');
  delete_btn.addEventListener('click', () => {deleteSession(session_name);});
  delete_btn.textContent = 'Delete session';
  delete_btn.setAttribute('class', 'delete');

  session_option.appendChild(session_header_container);
  session_option.appendChild(session_header_edit_btn_container);
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

  if(!saved_sessions[name])
    displaySessionOption(name, curr_session);

  saved_sessions[name] = curr_session;

  browser.storage.local.set({
    'sessions': saved_sessions
  });
}

// Asynchronous fetches
fetchCurrentSession();
fetchSavedSessions();
