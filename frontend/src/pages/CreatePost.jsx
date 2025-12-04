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
import { useState, useRef } from "react";
import { PhotoIcon } from "@heroicons/react/24/outline";

export default function CreatePost() {
  const [showMenu, setShowMenu] = useState(false);
  const [titleTouched, setTitleTouched] = useState(false);
  const [linkTouched, setLinkTouched] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState("");
  const [activeTab, setActiveTab] = useState("Text");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  const textareaRef = useRef(null);

  const tabs = ["Text", "Images & Video", "Link", "Poll"];

  const handleSubmit = () => {
    if (!title) {
      setErrorMessage("Please fill out this field.");
      return;
    }
    console.log({ selectedCommunity, title, content, files });
    setTitle("");
    setContent("");
    setFiles([]);
    setSelectedCommunity("");
    setErrorMessage("");
  };

  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
  };

  // Determine if buttons should be enabled
  const isButtonEnabled = title && (activeTab !== "Link" || content);

  return (
    <div className="bg-white min-h-screen py-10 px-6">
      <div className="max-w-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Create post</h1>
          <span className="text-black text-lg font-semibold cursor-pointer">Drafts</span>
        </div>

       {/* Community selector */}
<div className="mb-4 relative w-fit">
  <button
    onClick={() => setShowMenu(!showMenu)}
    className="flex items-center justify-between px-4 py-2 border border-gray-300 rounded-full bg-gray-200 text-black font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
  >
    <div className="flex items-center gap-2">
      {/* Reddit-style icon */}
      <div className="bg-black text-white rounded-full px-2 py-1 text-sm font-bold">r/</div>
      {/* Smaller but bold text */}
      <span className="text-sm font-bold">
        {selectedCommunity ? selectedCommunity : "Select a community"}
      </span>
    </div>
    <svg
      className="w-4 h-4 text-gray-700"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
    </svg>
  </button>

  {/* Dropdown menu */}
  {showMenu && (
    <ul className="absolute z-10 mt-2 w-64 bg-gray-200 border border-gray-300 rounded-md shadow-lg">
      {["r/community1", "r/community2", "r/community3"].map((community) => (
        <li
          key={community}
          onClick={() => {
            setSelectedCommunity(community);
            setShowMenu(false);
          }}
          className="px-4 py-2 hover:bg-gray-300 cursor-pointer text-sm font-bold text-black"
        >
          {community}
        </li>
      ))}
    </ul>
  )}
</div>


        {/* Tabs */}
        <div className="flex gap-7 border-b border-gray-200 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => tab !== "Poll" && setActiveTab(tab)}
              className={`pb-2 text-sm font-medium ${
                activeTab === tab
                  ? "border-b-2 border-blue-500 text-black"
                  : tab === "Poll"
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-black"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Title input */}
        <div className="mb-4 relative">
  {!title && (
    <div className="absolute top-2 left-4 text-gray-500 pointer-events-none">
      Title<span className="text-red-500">*</span>
    </div>
  )}
  <input
    type="text"
    value={title}
    onChange={(e) => setTitle(e.target.value)}
    onBlur={() => setTitleTouched(true)}
    maxLength={300}
    className={`w-full px-4 py-2 rounded-full bg-white text-gray-900 focus:outline-none focus:ring-2 ${
      !title && titleTouched ? "border-red-500 ring-red-500" : "border-gray-300 focus:ring-blue-500"
    }`}
  />
  <div className="text-right text-xs text-gray-400 mt-1">{title.length}/300</div>
  {!title && titleTouched && (
    <div className="text-red-500 text-sm mt-1">Please fill out this field.</div>
  )}
</div>

        {/* Add Tag button - all tabs except Poll */}
        {activeTab !== "Poll" && (
          <div className="mb-4 flex justify-start">
            <button
              onClick={() => {}}
              className="px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-sm cursor-not-allowed"
            >
              Add tags
            </button>
          </div>
        )}

        {/* Body / Content */}
        <div className="mb-4 relative">
          {activeTab === "Text" && (
            <div className="relative border border-gray-300 rounded-3xl bg-white">
              {/* Toolbar */}
              <div className="flex justify-between items-center px-4 pt-2">
                <div className="flex gap-1 flex-nowrap overflow-x-auto">
                  {/* Bold */}
                  <button
                    onClick={() => document.execCommand("bold")}
                    className="px-2 py-0.5 border border-gray-200 rounded text-xs text-gray-700 hover:bg-gray-200"
                  >
                    B
                  </button>
                  {/* Italic */}
                  <button
                    onClick={() => document.execCommand("italic")}
                    className="px-2 py-0.5 border border-gray-200 rounded text-xs text-gray-700 hover:bg-gray-200"
                  >
                    I
                  </button>
                  {/* Superscript */}
                  <button
                    onClick={() => document.execCommand("superscript")}
                    className="px-2 py-0.5 border border-gray-200 rounded text-xs text-gray-700 hover:bg-gray-200"
                  >
                    Sup
                  </button>
                  {/* Strikethrough */}
                  <button
                    onClick={() => document.execCommand("strikeThrough")}
                    className="px-2 py-0.5 border border-gray-200 rounded text-xs text-gray-700 hover:bg-gray-200"
                  >
                    S
                  </button>
                </div>
                {/* 3 Dots */}
                <div className="text-gray-600 text-xs cursor-pointer select-none">...</div>
              </div>

              {/* ContentEditable div */}
              {!content && (
                <div className="absolute top-10 left-4 text-gray-500 pointer-events-none">
                  Body text (optional)
                </div>
              )}
              <div
                contentEditable
                onInput={(e) => setContent(e.currentTarget.innerHTML)}
                className="w-full px-4 pt-12 pb-2 bg-white text-gray-900 focus:outline-none rounded-3xl min-h-[150px]"
                suppressContentEditableWarning={true}
              ></div>
            </div>
          )}

          {activeTab === "Images & Video" && (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-3xl bg-white h-40 cursor-pointer hover:border-blue-500 transition">
              <PhotoIcon className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-gray-500 text-sm">Drag and Drop or upload media</span>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          )}

          {activeTab === "Link" && (
            <div className="relative">
    {!content && (
      <div className="absolute top-2 left-4 text-gray-500 pointer-events-none">
        Link URL<span className="text-red-500">*</span>
      </div>
    )}
    <input
      type="text"
      value={content}
      onChange={(e) => setContent(e.target.value)}
      onBlur={() => setLinkTouched(true)}
      className={`w-full px-4 py-2 rounded-3xl bg-white text-gray-900 focus:outline-none focus:ring-2 ${
        !content && linkTouched ? "border-red-500 ring-red-500" : "border-gray-300 focus:ring-blue-500"
      }`}
    />
    {!content && linkTouched && (
      <div className="text-red-500 text-sm mt-1">Please fill out this field.</div>
    )}
  </div>
          )}
        </div>

        {/* Error message */}
        {errorMessage && <div className="text-red-500 mb-4">{errorMessage}</div>}

        {/* Buttons */}
        <div className="flex justify-end gap-2 mb-10">
          <button
            onClick={() => console.log("Draft saved")}
            disabled={!isButtonEnabled}
            className={`px-4 py-2 rounded-full text-white ${
              isButtonEnabled
                ? "bg-[#0079D3] hover:bg-[#0060A8]"
                : "bg-gray-200 cursor-not-allowed"
            }`}
          >
            Save Draft
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isButtonEnabled}
            className={`px-4 py-2 rounded-full text-white ${
              isButtonEnabled
                ? "bg-[#0079D3] hover:bg-[#0060A8]"
                : "bg-gray-200 cursor-not-allowed"
            }`}
          >
            Post
          </button>
        </div>

        {/* Footer */}
        <footer className="mt-auto text-sm text-gray-500 text-center">
          Reddit Rules · Privacy Policy · User Agreement · Accessibility · Reddit, Inc. © 2025. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
