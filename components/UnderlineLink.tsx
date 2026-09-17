type Props = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
  children: React.ReactNode
  className?: string
}

export const underlineClass =
  "relative inline-block py-1 after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-current after:transition-transform after:duration-300 after:ease-out hover:after:origin-left hover:after:scale-x-100 motion-reduce:after:transition-none"

/** Text link whose underline draws in from the left and retreats to the right. */
export default function UnderlineLink({ href, children, className = "", ...rest }: Props) {
  return (
    <a href={href} {...rest} className={`${underlineClass} ${className}`}>
      {children}
    </a>
  )
}
