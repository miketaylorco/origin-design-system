import { forwardRef } from "react";

export const ArrowLeftIcon = forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  (props, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M2.21875 9.46875C1.925 9.7625 1.925 10.2375 2.21875 10.5281L7.46875 15.7812C7.7625 16.075 8.2375 16.075 8.52812 15.7812C8.81875 15.4875 8.82187 15.0125 8.52812 14.7219L4.55938 10.75H17.25C17.6656 10.75 18 10.4156 18 10C18 9.58438 17.6656 9.25 17.25 9.25H4.55938L8.53125 5.28125C8.825 4.9875 8.825 4.5125 8.53125 4.22188C8.2375 3.93125 7.7625 3.92813 7.47188 4.22188L2.21875 9.46875Z"/>
    </svg>
  )
);
ArrowLeftIcon.displayName = "ArrowLeftIcon";
