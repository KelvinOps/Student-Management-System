import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { Search, Filter } from "lucide-react"
import { useState } from "react"

interface SearchBarProps {
  placeholder?: string
  onSearch?: (query: string) => void
  showFilter?: boolean
  onFilterClick?: () => void
}

export function SearchBar({ 
  placeholder = "Search...", 
  onSearch,
  showFilter = false,
  onFilterClick 
}: SearchBarProps) {
  const [query, setQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(query)
    console.log('Search query:', query)
  }

  return (
    <form onSubmit={handleSearch} className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
          data-testid="input-search"
        />
      </div>
      {showFilter && (
        <Button 
          type="button" 
          variant="outline" 
          size="icon"
          onClick={onFilterClick}
          data-testid="button-filter"
        >
          <Filter className="h-4 w-4" />
        </Button>
      )}
      <Button type="submit" data-testid="button-search">
        Search
      </Button>
    </form>
  )
}
