import { MdFirstPage, MdLastPage, MdNavigateBefore, MdNavigateNext } from 'react-icons/md'
import Button from './Button'

export default function Pagination({ page, pages, onPageChange }) {
  const canPrev = page > 1
  const canNext = page < pages

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="text-sm text-[rgb(var(--text-muted))]">
        Page <span className="font-semibold text-[rgb(var(--text))]">{page}</span> of{' '}
        <span className="font-semibold text-[rgb(var(--text))]">{pages}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => onPageChange(1)} disabled={!canPrev}>
          <MdFirstPage />
          First
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrev}
        >
          <MdNavigateBefore />
          Prev
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!canNext}
        >
          Next
          <MdNavigateNext />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onPageChange(pages)} disabled={!canNext}>
          Last
          <MdLastPage />
        </Button>
      </div>
    </div>
  )
}
