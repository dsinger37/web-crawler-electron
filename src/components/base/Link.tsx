import { DataInteractive as HeadlessDataInteractive } from "@headlessui/react";
import { forwardRef, type ComponentPropsWithoutRef, type ForwardedRef } from "react";
export const Link = forwardRef(function Link(props: { href: string } & ComponentPropsWithoutRef<"a">, ref: ForwardedRef<HTMLAnchorElement>) {
  return (
    <HeadlessDataInteractive>
      <a {...props} ref={ref} />
    </HeadlessDataInteractive>
  );
});
