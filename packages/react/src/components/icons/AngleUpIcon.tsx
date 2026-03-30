import { forwardRef } from "react";

export const AngleUpIcon = forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  (props, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M9.48437 6.46875C9.77812 6.175 10.2531 6.175 10.5437 6.46875L15.5437 11.4688C15.8375 11.7625 15.8375 12.2375 15.5437 12.5281C15.25 12.8188 14.775 12.8219 14.4844 12.5281L10.0156 8.05938L5.54687 12.5281C5.25312 12.8219 4.77812 12.8219 4.4875 12.5281C4.19687 12.2344 4.19375 11.7594 4.4875 11.4688L9.4875 6.46875H9.48437Z"/>
    </svg>
  )
);
AngleUpIcon.displayName = "AngleUpIcon";
