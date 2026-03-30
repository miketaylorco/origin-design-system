import { forwardRef } from "react";

export const AngleDownIcon = forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  (props, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M10.5469 13.5312C10.2531 13.825 9.77812 13.825 9.4875 13.5312L4.48437 8.53125C4.19062 8.2375 4.19062 7.7625 4.48437 7.47187C4.77812 7.18125 5.25312 7.17812 5.54375 7.47187L10.0125 11.9406L14.4812 7.47187C14.775 7.17812 15.25 7.17812 15.5406 7.47187C15.8312 7.76562 15.8344 8.24062 15.5406 8.53125L10.5406 13.5312H10.5469Z"/>
    </svg>
  )
);
AngleDownIcon.displayName = "AngleDownIcon";
