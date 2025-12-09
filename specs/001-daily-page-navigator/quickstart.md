# Quickstart: Daily Page Navigator

## Generating the Index Page

To generate the index page with the new navigation structure:

1.  **Ensure Pre-requisites**:
    - You have at least one valid daily update in `updates/YYYY-MM-DD/`.
    - That directory contains an `index.html` file (or creates one - *Note: current logic might rely on previous runs*).

2.  **Run the Index Command**:
    ```bash
    yarn index
    ```
    OR
    ```bash
    tsx src/cli.ts index
    ```

3.  **Verify**:
    - Open `updates/index.html` in a browser.
    - Check the sidebar.
    - "This Week" should be at the top.
    - Daily links for the current week should follow.
    - "Archive" section should appear if older dates exist.
    - Click links to verify they go to `updates/YYYY-MM-DD/index.html`.

## Running Full Update

To run the full research and update cycle:

```bash
yarn update
```
