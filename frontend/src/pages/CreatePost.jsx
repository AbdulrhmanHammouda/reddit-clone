import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { PhotoIcon } from "@heroicons/react/24/outline";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";  
import {
  faBold,
  faItalic,
  faStrikethrough,
  faSuperscript,
  faLink,
  faImage,
  faVideo,
  faListUl,
  faListOl,
  faQuoteRight,
  faCode,
  faTable,
  faEllipsisV
} from "@fortawesome/free-solid-svg-icons";

export default function CreatePost() {
  const navigate = useNavigate();

  const [showMenu, setShowMenu] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedCommunity, setSelectedCommunity] = useState("");
  const [activeTab, setActiveTab] = useState("Text");
  const [files, setFiles] = useState([]);
  const [titleTouched, setTitleTouched] = useState(false);
  const [linkTouched, setLinkTouched] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const textareaRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const tabs = ["Text", "Images & Video", "Link", "Poll"];

  const isFormValid =
    title.trim() !== "" &&
    (activeTab !== "Link" ? true : content.trim() !== "");

  // ------------------------------------
  // FILE HANDLING WITH PREVIEW
  // ------------------------------------
  const handleFileChange = (e) => {
    const selected = [...e.target.files];
    const mapped = selected.map((f) => ({
      file: f,
      preview: URL.createObjectURL(f),
      type: f.type.startsWith("video") ? "video" : "image",
    }));
    setFiles((prev) => [...prev, ...mapped]);
  };

  // ------------------------------------
  // SUBMIT HANDLER
  // ------------------------------------
  const handleSubmit = async () => {
    setErrorMsg("");

    if (!isFormValid) {
      setErrorMsg("Please complete the required fields.");
      return;
    }

    const postData = {
      community: selectedCommunity,
      title,
      type: activeTab,
      content,
      media: files.map((f) => f.file.name),
      createdAt: new Date().toISOString(),
    };

    try {
      console.log("Sending post →", postData);

      await new Promise((resolve) => setTimeout(resolve, 700));

      setTitle("");
      setContent("");
      setFiles([]);
      setSelectedCommunity("");

      navigate("/");
    } catch (err) {
      setErrorMsg("Something went wrong while posting.");
    }
  };

  // ------------------------------------
  // UTILITY: INSERT LIST
  // ------------------------------------
  const insertList = (type) => {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    const selectedText = sel.toString();

    const list = document.createElement(type); // "ul" or "ol"

    if (!selectedText) {
      const li = document.createElement("li");
      li.textContent = "List item";
      list.appendChild(li);
      range.insertNode(list);
    } else {
      const lines = selectedText.split("\n").filter((line) => line.trim() !== "");
      lines.forEach((line) => {
        const li = document.createElement("li");
        li.textContent = line;
        list.appendChild(li);
      });
      range.deleteContents();
      range.insertNode(list);
    }

    sel.removeAllRanges();
    const newRange = document.createRange();
    newRange.setStartAfter(list);
    newRange.collapse(true);
    sel.addRange(newRange);

    textareaRef.current.focus();
  };

  return (
    <div className="bg-white dark:bg-reddit-dark_bg min-h-screen py-10 px-6">
      <div className="max-w-2xl">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-reddit-dark_text">Create post</h1>
          <span className="text-black dark:text-reddit-dark_text text-lg font-semibold cursor-pointer">Drafts</span>
        </div>

        {/* Community selector */}
        <div className="mb-4 relative w-fit">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center justify-between px-4 py-2 border border-gray-300 dark:border-reddit-dark_border rounded-full bg-gray-200 dark:bg-reddit-dark_hover text-black dark:text-reddit-dark_text font-bold w-64"
          >
            <div className="flex items-center gap-2">
              <div className="bg-black text-white rounded-full px-2 py-1 text-sm font-bold">r/</div>
              <span className="text-sm font-bold">
                {selectedCommunity || "Select a community"}
              </span>
            </div>
            <svg
              className="w-4 h-4 text-gray-700 dark:text-reddit-dark_text"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>

          {showMenu && (
            <ul className="absolute z-10 mt-2 w-64 bg-gray-200 dark:bg-reddit-dark_card border border-gray-300 dark:border-reddit-dark_border rounded-md shadow">
              {["r/community1", "r/community2", "r/community3"].map((c) => (
                <li
                  key={c}
                  onClick={() => {
                    setSelectedCommunity(c);
                    setShowMenu(false);
                  }}
                  className="px-4 py-2 hover:bg-gray-300 dark:hover:bg-reddit-dark_hover cursor-pointer text-sm font-bold text-black dark:text-reddit-dark_text"
                >
                  {c}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-7 border-b border-gray-200 dark:border-reddit-dark_border mb-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => tab !== "Poll" && setActiveTab(tab)}
              className={`pb-2 text-sm font-medium ${
                activeTab === tab
                  ? "border-b-2 border-blue-500 dark:border-reddit-dark_blue text-black dark:text-reddit-dark_text"
                  : tab === "Poll"
                  ? "text-gray-400 dark:text-reddit-dark_text_secondary cursor-not-allowed"
                  : "text-black dark:text-reddit-dark_text"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Title Input */}
        <div className="mb-4 relative">
          {!title && (
            <div className="absolute top-2 left-4 text-gray-500 dark:text-reddit-dark_text_secondary pointer-events-none">
              Title<span className="text-red-500">*</span>
            </div>
          )}
          <input
            maxLength={300}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setTitleTouched(true)}
            className={`w-full px-4 py-2 rounded-full bg-white dark:bg-reddit-dark_card text-gray-900 dark:text-reddit-dark_text border ${
              !title && titleTouched
                ? "border-red-500"
                : "border-gray-300 dark:border-reddit-dark_border focus:ring-blue-500"
            } focus:outline-none`}
          />
          <div className="text-right text-xs text-gray-400 dark:text-reddit-dark_text_secondary mt-1">{title.length}/300</div>
        </div>

        {/* Add Tags */}
        {activeTab !== "Poll" && (
          <button className="px-3 py-1 rounded-full bg-gray-100 dark:bg-reddit-dark_card text-gray-500 dark:text-reddit-dark_text_secondary text-sm cursor-not-allowed mb-4">
            Add tags
          </button>
        )}

        {/* Content */}
        <div className="mb-4">

          {/* TEXT TAB */}
          {activeTab === "Text" && (
            <div className="relative border border-gray-300 dark:border-reddit-dark_border rounded-3xl bg-white dark:bg-reddit-dark_card">
              {/* Toolbar */}
              <div className="flex justify-between items-center px-4 pt-2 overflow-x-auto">
                <div className="flex gap-1 flex-nowrap">
                  {[
                    {icon: faBold, cmd: "bold"},
                    {icon: faItalic, cmd: "italic"},
                    {icon: faSuperscript, cmd: "superscript"},
                    {icon: faStrikethrough, cmd: "strikeThrough"},
                  ].map(({icon, cmd}, idx) => (
                    <button
                      key={idx}
                      onClick={() => document.execCommand(cmd)}
                      className="px-2 py-0.5 border border-gray-200 dark:border-reddit-dark_border rounded text-xs text-gray-700 dark:text-reddit-dark_text hover:bg-gray-200 dark:hover:bg-reddit-dark_hover"
                    >
                      <FontAwesomeIcon icon={icon} />
                    </button>
                  ))}

                  {/* Link, Image, Video */}
                  <button
                    onClick={() => document.execCommand("createLink", false, prompt("Enter URL"))}
                    className="px-2 py-0.5 border border-gray-200 dark:border-reddit-dark_border rounded text-xs text-gray-700 dark:text-reddit-dark_text hover:bg-gray-200 dark:hover:bg-reddit-dark_hover"
                  >
                    <FontAwesomeIcon icon={faLink} />
                  </button>
                  <button
                    onClick={() => imageInputRef.current.click()}
                    className="px-2 py-0.5 border border-gray-200 dark:border-reddit-dark_border rounded text-xs text-gray-700 dark:text-reddit-dark_text hover:bg-gray-200 dark:hover:bg-reddit-dark_hover"
                  >
                    <FontAwesomeIcon icon={faImage} />
                  </button>
                  <button
                    onClick={() => videoInputRef.current.click()}
                    className="px-2 py-0.5 border border-gray-200 dark:border-reddit-dark_border rounded text-xs text-gray-700 dark:text-reddit-dark_text hover:bg-gray-200 dark:hover:bg-reddit-dark_hover"
                  >
                    <FontAwesomeIcon icon={faVideo} />
                  </button>

                  {/* Lists */}
                  <button
                    onClick={() => insertList("ul")}
                    className="px-2 py-0.5 border border-gray-200 dark:border-reddit-dark_border rounded text-xs text-gray-700 dark:text-reddit-dark_text hover:bg-gray-200 dark:hover:bg-reddit-dark_hover"
                  >
                    <FontAwesomeIcon icon={faListUl} />
                  </button>
                  <button
                    onClick={() => insertList("ol")}
                    className="px-2 py-0.5 border border-gray-200 dark:border-reddit-dark_border rounded text-xs text-gray-700 dark:text-reddit-dark_text hover:bg-gray-200 dark:hover:bg-reddit-dark_hover"
                  >
                    <FontAwesomeIcon icon={faListOl} />
                  </button>

                  <button
                    onClick={() => document.execCommand("formatBlock", false, "blockquote")}
                    className="px-2 py-0.5 border border-gray-200 dark:border-reddit-dark_border rounded text-xs text-gray-700 dark:text-reddit-dark_text hover:bg-gray-200 dark:hover:bg-reddit-dark_hover"
                  >
                    <FontAwesomeIcon icon={faQuoteRight} />
                  </button>
                  <button
                    onClick={() => document.execCommand("insertHTML", false, `<code>${window.getSelection()}</code>`)}
                    className="px-2 py-0.5 border border-gray-200 dark:border-reddit-dark_border rounded text-xs text-gray-700 dark:text-reddit-dark_text hover:bg-gray-200 dark:hover:bg-reddit-dark_hover"
                  >
                    <FontAwesomeIcon icon={faCode} />
                  </button>
                  <button
  onClick={() => {
    const rows = parseInt(prompt("Enter number of rows", "2"), 10);
    const cols = parseInt(prompt("Enter number of columns", "2"), 10);

    if (isNaN(rows) || isNaN(cols) || rows < 1 || cols < 1) {
      alert("Invalid number of rows or columns!");
      return;
    }

    let tableHTML = `<table class="w-full border border-gray-400 dark:border-gray-600 border-collapse">`;

    for (let r = 0; r < rows; r++) {
      tableHTML += "<tr>";
      for (let c = 0; c < cols; c++) {
        tableHTML += `<td class="border border-gray-400 dark:border-gray-600 px-2 py-1">&nbsp;</td>`;
      }
      tableHTML += "</tr>";
    }

    tableHTML += "</table><br/>";

                  document.execCommand("insertHTML", false, tableHTML);
          }}
              className="px-2 py-0.5 border border-gray-200 dark:border-reddit-dark_border rounded text-xs text-gray-700 dark:text-reddit-dark_text hover:bg-gray-200 dark:hover:bg-reddit-dark_hover"
            >
              <FontAwesomeIcon icon={faTable} />
              </button>

                </div>

                <div className="text-gray-600 dark:text-reddit-dark_text text-xs cursor-pointer select-none">
                  <FontAwesomeIcon icon={faEllipsisV} />
                </div>
              </div>

              {/* ContentEditable div with placeholder */}
              <div
  ref={textareaRef}
  contentEditable
  onInput={(e) => setContent(e.currentTarget.innerHTML)}
  className="w-full px-4 pt-12 pb-2 bg-white dark:bg-reddit-dark_card text-gray-900 dark:text-reddit-dark_text 
             focus:outline-none rounded-3xl min-h-[150px]
             pl-5
             [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6"
  suppressContentEditableWarning={true}
>

  {content === "" && (
    <span className="text-gray-400 dark:text-reddit-dark_text_secondary pointer-events-none absolute top-12 left-4">
      Body text (optional)
    </span>
  )}
</div>

            </div>
          )}

          {/* MEDIA TAB */}
          {activeTab === "Images & Video" && (
            <div>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-reddit-dark_border rounded-3xl bg-white dark:bg-reddit-dark_card h-40 cursor-pointer hover:border-blue-500 dark:hover:border-reddit-dark_blue">
                <PhotoIcon className="h-8 w-8 text-gray-400 dark:text-reddit-dark_text mb-2" />
                <span className="text-gray-500 dark:text-reddit-dark_text_secondary text-sm">Upload media</span>
                <input type="file" accept="image/*,video/*" className="hidden" multiple onChange={handleFileChange} />
              </label>

              {files.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {files.map((f, i) =>
                    f.type === "image" ? (
                      <img key={i} src={f.preview} alt="preview" className="rounded-xl h-24 object-cover" />
                    ) : (
                      <video key={i} src={f.preview} controls className="rounded-xl h-24 object-cover" />
                    )
                  )}
                </div>
              )}
            </div>
          )}

          {/* LINK TAB */}
          {activeTab === "Link" && (
            <div className="relative">
              {!content && (
                <div className="absolute top-2 left-4 text-gray-500 dark:text-reddit-dark_text_secondary pointer-events-none">
                  Link URL<span className="text-red-500">*</span>
                </div>
              )}
              <input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onBlur={() => setLinkTouched(true)}
                className={`w-full px-4 py-2 rounded-3xl bg-white dark:bg-reddit-dark_card text-gray-900 dark:text-reddit-dark_text border ${
                  !content && linkTouched
                    ? "border-red-500"
                    : "border-gray-300 dark:border-reddit-dark_border focus:ring-blue-500"
                } focus:outline-none`}
              />
            </div>
          )}

          {/* Hidden inputs */}
          <input
            type="file"
            accept="image/*"
            ref={imageInputRef}
            style={{ display: "none" }}
            multiple
            onChange={handleFileChange}
          />
          <input
            type="file"
            accept="video/*"
            ref={videoInputRef}
            style={{ display: "none" }}
            multiple
            onChange={handleFileChange}
          />
        </div>

        {/* Error */}
        {errorMsg && <p className="text-red-500 mb-4">{errorMsg}</p>}

        {/* Buttons */}
        <div className="flex justify-end gap-2 mb-10">
          <button
            disabled={!isFormValid}
            className={`px-4 py-2 rounded-full text-white ${isFormValid ? "bg-[#0079D3] dark:bg-reddit-dark_blue" : "bg-gray-300 cursor-not-allowed"}`}
          >
            Save Draft
          </button>

          <button
            onClick={handleSubmit}
            disabled={!isFormValid}
            className={`px-4 py-2 rounded-full text-white ${isFormValid ? "bg-[#0079D3] dark:bg-reddit-dark_blue" : "bg-gray-300 cursor-not-allowed"}`}
          >
            Post
          </button>
        </div>

      </div>
    </div>
  );
}

