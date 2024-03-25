import {
  Description as HeadlessDescription,
  Field as HeadlessField,
  Fieldset as HeadlessFieldset,
  Label as HeadlessLabel,
  Legend as HeadlessLegend,
  type DescriptionProps as HeadlessDescriptionProps,
  type FieldProps as HeadlessFieldProps,
  type FieldsetProps as HeadlessFieldsetProps,
  type LabelProps as HeadlessLabelProps,
  type LegendProps as HeadlessLegendProps,
} from "@headlessui/react";
import { clsx } from "clsx";
import type { ComponentPropsWithoutRef } from "react";

export const Fieldset = ({
  className,
  ...props
}: { disabled?: boolean } & HeadlessFieldsetProps) => {
  return (
    <HeadlessFieldset
      {...props}
      className={clsx(
        className,
        "[&>*+[data-slot=control]]:mt-6 [&>[data-slot=text]]:mt-1",
      )}
    />
  );
};

export const Legend = ({ ...props }: HeadlessLegendProps) => {
  return (
    <HeadlessLegend
      {...props}
      className={clsx(
        props.className,
        "text-base/6 font-semibold text-zinc-950 data-[disabled]:opacity-50 sm:text-sm/6 dark:text-white",
      )}
      data-slot="legend"
    />
  );
};

export const FieldGroup = ({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) => {
  return (
    <div
      {...props}
      className={clsx(className, "space-y-8")}
      data-slot="control"
    />
  );
};

export const Field = ({ className, ...props }: HeadlessFieldProps) => {
  return (
    <HeadlessField
      className={clsx(
        className,
        "[&>[data-slot=label]+[data-slot=control]]:mt-3",
        "[&>[data-slot=label]+[data-slot=description]]:mt-1",
        "[&>[data-slot=description]+[data-slot=control]]:mt-3",
        "[&>[data-slot=control]+[data-slot=description]]:mt-3",
        "[&>[data-slot=control]+[data-slot=error]]:mt-3",
        "[&>[data-slot=label]]:font-medium",
      )}
      {...props}
    />
  );
};

export const Label = ({
  className,
  ...props
}: { className?: string } & HeadlessLabelProps) => {
  return (
    <HeadlessLabel
      {...props}
      className={clsx(
        className,
        "select-none text-base/6 text-zinc-950 data-[disabled]:opacity-50 sm:text-sm/6 dark:text-white",
      )}
      data-slot="label"
    />
  );
};

export const Description = ({
  className,
  disabled,
  ...props
}: { className?: string; disabled?: boolean } & HeadlessDescriptionProps) => {
  return (
    <HeadlessDescription
      {...props}
      className={clsx(
        className,
        "text-base/6 text-zinc-500 data-[disabled]:opacity-50 sm:text-sm/6 dark:text-zinc-400",
      )}
      data-slot="description"
    />
  );
};

export const ErrorMessage = ({
  className,
  disabled,
  ...props
}: { className?: string; disabled?: boolean } & HeadlessDescriptionProps) => {
  return (
    <HeadlessDescription
      {...props}
      className={clsx(
        className,
        "text-base/6 text-red-600 data-[disabled]:opacity-50 sm:text-sm/6 dark:text-red-500",
      )}
      data-slot="error"
    />
  );
};
