import { useState, useCallback } from "react";
import debounce from "lodash.debounce";
import { FiSearch } from "react-icons/fi";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, placeholder }) => {
  const [searchInput, setSearchInput] = useState("");

 
  const debouncedSearch = useCallback(
    debounce((query:string) => {
      onSearch(query);
    }, 300),
    []
  );

  return (
    <div className="relative w-max shrink-0">
      <FiSearch size={16} className="text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
      <input
        type="text"
        className="pl-8 w-[300px] p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
        placeholder={placeholder || "Search..."}
        value={searchInput}
        onChange={(e) => {
          setSearchInput(e.target.value);
          debouncedSearch(e.target.value);
        }}
      />
    </div>
  );
};

export default SearchBar;
