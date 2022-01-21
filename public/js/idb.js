let db;
// establish a connection to IndexedDB database  and set it to version 1
const request = indexedDB.open("budget-tracker", 1);

request.onupgradeneeded = function (event) {
  // save a reference to the database
  const db = event.target.result;
  // create an object store (table), set it to have an auto incrementing primary key of sorts
  db.createObjectStore("new_track", { autoIncrement: true });
};

// upon a successful
request.onsuccess = function (event) {
  // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
  db = event.target.result;

  // check if app is online, if yes run  function to send all local db data to api
  if (navigator.onLine) {
    uploadTrack();
  }
};

//if there's error:
request.onerror = function (event) {
  console.log(event.target.errorCode);
};

// This function will be executed if we attempt to submit a new one and there's no internet connection
function saveRecord(record) {
  // open a new transaction with the database with read and write permissions
  const transaction = db.transaction(["new_track"], "readwrite");

  // access the object store
  const budgetObjectStore = transaction.objectStore("new_track");

  // add record to your store with add method
  budgetObjectStore.add(record);
}

function uploadTrack() {
  // open a transaction on your db
  const transaction = db.transaction(["new_track"], "readwrite");

  // access your object store
  const trackObjectStore = transaction.objectStore("new_track");

  // get all records from store and set to a variable
  const getAll = trackObjectStore.getAll();

  // upon a successful .getAll() execution, run this function
  getAll.onsuccess = function () {
    // if there was data in indexedDb's store, let's send it to the api server
    if (getAll.result.length > 0) {
      fetch("/api/transaction", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // open one more transaction
          const transaction = db.transaction(["new_track"], "readwrite");
          // access the new_pizza object store
          const trackObjectStore = transaction.objectStore("new_track");
          // clear all items in your store
          trackObjectStore.clear();

          alert("All saved budget tracks has been submitted!");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
}

// listen for app coming back online
window.addEventListener("online", uploadTrack);
