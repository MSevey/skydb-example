import React, { useState } from "react";
import { SkynetClient, keyPairFromSeed } from "skynet-js";
import logo from "./logo.svg";
import "./App.css";
import "fontsource-metropolis/all.css";

// Initialize SkynetClient
const skynetClient = new SkynetClient();

// Create filename for note data to be uploaded
const notesList = "notes.json";

function App() {
  // define constants of the format [value, setFunc]
  const [secret, setSecret] = useState("");
  const [notes, setNotes] = useState<Array<string>>([]);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [noteExists, setNoteExists] = useState(false);
  const [notesExists, setNotesExists] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [displaySuccess, setDisplaySuccess] = useState(false);

  // loadNote will try and load the note from SkyDB
  const loadNote = async () => {
    try {
      // We use the public Key to load the note
      const { publicKey } = keyPairFromSeed(secret);
      const entry = await skynetClient.db.getJSON(publicKey, noteTitle);

      // If there is a note, display it
      if (entry) {
        setNoteBody(entry.data?.noteBody ?? "");
        setNoteExists(true);
      }
      // If error, set the note as empty
    } catch (error) {
      setErrorMessage(error.message);
      setNoteTitle("");
      setNoteBody("");
      setNoteExists(false);
    }
  };

  // loadNotes will try and load the list of notes from SkyDB
  const loadNotes = async () => {
    console.log("loadNotes");
    try {
      // We use the public Key to load the note
      const { publicKey } = keyPairFromSeed(secret);
      const entry = await skynetClient.db.getJSON(publicKey, notesList);
      console.log("entry", entry);

      // If there are notes, display them
      if (entry.data.notes.length > 0) {
        setNotes(entry.data?.notes ?? []);
        setNotesExists(true);
      }
      // If error, set the note as empty
    } catch (error) {
      setErrorMessage(error.message);
      setNotes([]);
      setNotesExists(false);
    }
  };

  // handleLoadNote handles loading the note that the user clicked on
  const handleLoadNote = async () => {
    setLoading(true);

    await loadNote();
    console.log("note loaded", noteTitle, noteBody);
    setNotesExists(false);
    setLoading(false);
  };

  // handleLogin handles the login of the user providing a passphrase
  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);

    await loadNotes();

    setAuthenticated(true);
    setLoading(false);
  };

  // handleSetNote handles setting the note data in SkyDB
  const handleSetNote = async () => {
    console.log("handleSetNote", noteTitle, noteBody);
    setLoading(true);

    // We use the private Key to set the note and update the noteList
    const { privateKey } = keyPairFromSeed(secret);
    // Set the Note
    try {
      await skynetClient.db.setJSON(privateKey, noteTitle, { noteBody });

      // Since we want to save the notes list don't display success yet
    } catch (error) {
      setErrorMessage(error.message);
    }
    // Update the notes list
    await loadNotes();
    console.log("notes", notes);
    console.log("notes.indexOf(noteTitle)", notes.indexOf(noteTitle));
    if (notes.indexOf(noteTitle) === -1) {
      console.log("not title not found");
      setNotes(notes.concat(noteTitle));
      setNotesExists(true);
    }
    console.log("notes", notes);
    try {
      await skynetClient.db.setJSON(privateKey, notesList, { notes });

      setDisplaySuccess(true);
      setTimeout(() => setDisplaySuccess(false), 5000);
    } catch (error) {
      setErrorMessage(errorMessage + error.message);
      console.log(errorMessage);
    }

    setLoading(false);
  };

  console.log("notes", notes);
  console.log("noteTitle", noteTitle);
  console.log("noteBody", noteBody);
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />

        <div className="container">
          <h1>Note To Self</h1>
          {/* If the use has been authenticated by their passphrase then display their note */}
          {authenticated ? (
            <div>
              {!notesExists ? (
                <div>
                  {!noteExists && (
                    <div className="mb-2">
                      <div className="flex empty-note">
                        You did not set a note yet, write one below.
                      </div>
                    </div>
                  )}
                  <div className="mb-2">
                    <div className="flex">
                      <input
                        placeholder="Note Title"
                        value={noteTitle}
                        autoFocus={true}
                        onChange={(event) => setNoteTitle(event.target.value)}
                      />
                    </div>
                    <br />
                    <div className="flex">
                      <textarea
                        placeholder="Body of Note"
                        value={noteBody}
                        autoFocus={true}
                        onChange={(event) => setNoteBody(event.target.value)}
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={handleSetNote}
                      disabled={loading}
                    >
                      {loading ? "Sending..." : "Save this note"}
                    </button>
                    {displaySuccess && (
                      <span className="success-message">Note saved!</span>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-2">
                    <div className="flex empty-note">
                      Here are your notes. Select a note to edit.
                    </div>
                  </div>
                  <div className="mb-4">
                    {notes.map((nt) => (
                      <div className="mb-2">
                        <div className="flex">
                          <span
                            className="success-message"
                            onChange={(event) => setNoteTitle(nt)}
                          >
                            {nt}
                          </span>
                        </div>
                        <br />
                        <div className="flex">
                          <button type="button" onClick={handleLoadNote}>
                            Edit Note
                          </button>
                        </div>
                        <br />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* If the use has not been authenticated, display login screen */
            <form onSubmit={handleLogin}>
              <div className="mb-2">
                <label htmlFor="output">Secret</label>
                <div className="flex">
                  <input
                    id="output"
                    type="secret"
                    placeholder="Your very secret passphrase"
                    value={secret}
                    onChange={(event) => setSecret(event.target.value)}
                  />
                </div>
                <div>
                  {errorMessage && <p className="error">{errorMessage}</p>}
                </div>
              </div>
              <div className="mb-4">
                <button disabled={loading}>
                  {loading ? "Loading..." : "Load"}
                </button>
              </div>
            </form>
          )}
          <footer>
            Read more on{" "}
            <a
              href="https://github.com/kwypchlo/skydb-example"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </footer>
        </div>
      </header>
    </div>
  );
}

export default App;
