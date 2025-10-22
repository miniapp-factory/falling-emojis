# Index

## Instructions

You will be editing this farcaster nextjs mini app using shadcn components with tailwind based on the the provided instructions. Read the documents listed bellow when writing any code provided by the respective library. On the first user request, also update the [title and description](../mini-app/lib/metadata.ts) based on a summary of the app instructions. When adding or removing pages, update the [header](../mini-app/components/header.tsx) in case they should be added or removed from navigation. Make sure every component you write is included in at least one page, make sure every page can be routed to by pressing links or buttons. Use the [home page](../mini-app/app/page.tsx) for the main app functionality. Use existing components such as [Share](../mini-app/components/share.tsx) and those in [the UI folder](../mini-app/components/ui) when possible, do not alter these files. Do not use client hooks such as useState and useEffect on pages, only on "use client" components. When changing color or themes globally for the website, use the [Tailwind configuration file](../mini-app/app/globals.css). To generate images, create a file with `.png.todo` containing an utf8 description of the image to generate, after generation is done, this file will be available to include under the same file name with the `.png` extension.

## Framework

This app uses the [nextjs](./nextjs.md) framework.

## Components

This app uses [shadcn](./shadcn.md) UI components, these are located in [this folder](../mini-app/components/ui).

## Styling

This app uses [tailwind](./tailwind.md) for styling.

## Farcaster Mini App

This app uses [farcaster](./farcaster.md) for social integrations.
