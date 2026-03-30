import { forwardRef } from "react";

export const ArrowRightIcon = forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  (props, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M17.7812 10.5313C18.075 10.2375 18.075 9.7625 17.7812 9.47188L12.5312 4.21875C12.2375 3.925 11.7625 3.925 11.4719 4.21875C11.1813 4.5125 11.1781 4.9875 11.4719 5.27813L15.4406 9.24688H2.75C2.33437 9.24688 2 9.58125 2 9.99688C2 10.4125 2.33437 10.7469 2.75 10.7469H15.4406L11.4719 14.7156C11.1781 15.0094 11.1781 15.4844 11.4719 15.775C11.7656 16.0656 12.2406 16.0687 12.5312 15.775L17.7812 10.5313Z"/>
    </svg>
  )
);
ArrowRightIcon.displayName = "ArrowRightIcon";
