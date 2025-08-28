# %%
# STEP 1: Import libraries and define file paths
import pandas as pd
import json
import os

# --- Configuration ---
NODES_FILE = "../data/raw_data/nodes_pg.csv"
EDGES_FILE = "../data/raw_data/edges.csv"
ATTRIBUTES_FILE = "../data/processed_data/parameters.csv"
OUTPUT_DIR = "../data/synth_networks"  # Directory to save the generated JSON files

print("Step 1 Complete: Libraries imported and configuration set.")

# %%
# STEP 2: Load data from CSV files into pandas DataFrames
print("Step 2: Loading data from CSV files...")
try:
    nodes_df = pd.read_csv(NODES_FILE)
    edges_df = pd.read_csv(EDGES_FILE)
    attributes_df = pd.read_csv(ATTRIBUTES_FILE)
    print("All files loaded successfully.")

    # Display the first few rows of each DataFrame to verify
    print("\n--- Nodes DataFrame Head ---")
    print(nodes_df.head())
    print("\n--- Edges DataFrame Head ---")
    print(edges_df.head())
    print("\n--- Attributes DataFrame Head ---")
    print(attributes_df.head())

except FileNotFoundError as e:
    print(f"ERROR: {e}. Please ensure all CSV files are in the correct directory.")

# %%
# STEP 3: Prepare for processing by identifying unique networks
# and creating the output directory.

# Create the output directory if it doesn't exist
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Get a list of unique network IDs from the attributes dataframe
network_ids = attributes_df["id"].unique()

print(f"Step 3 Complete: Output directory '{OUTPUT_DIR}' is ready.")
print(f"Found {len(network_ids)} unique network(s) to process: {network_ids}")

# %% NO FUNCTIONAAAAA
# STEP 4: Loop through each network ID and build the final structure

print("\nStep 4: Starting the conversion process for each network...")

if not "network_ids" in locals():
    print("ERROR: 'network_ids' not defined. Please run the previous cells first.")
else:
    # Process each network ID found in the previous step
    for network_id in network_ids:
        print(f"\n--- Processing network {network_id} ---")

        # 4a. Filter data for the current network ID
        current_nodes = nodes_df[nodes_df["id"] == network_id].copy()
        current_edges = edges_df[edges_df["id"] == network_id]
        current_attributes_row = attributes_df[
            attributes_df["id"] == network_id
        ]

        # 4b. Prepare the 'nodes' list for the D3 network object
        current_nodes.rename(columns={"node": "id"}, inplace=True)
        current_nodes["name"] = current_nodes["id"].astype(str)
        nodes_list = current_nodes.drop(columns=["id"]).to_dict("records")

        # 4c. Prepare the 'links' list for the D3 network object
        links_list = current_edges[["source", "target"]].to_dict("records")

        # 4d. Assemble the D3-compatible network object
        d3_network_data = {"nodes": nodes_list, "links": links_list}

        # 4e. Prepare the 'attributes' object
        if not current_attributes_row.empty:
            attributes_dict = current_attributes_row.to_dict("records")[0]
            # Ensure the 'id' within the attributes is a string, as in the original
            attributes_dict["id"] = str(attributes_dict["id"])
        else:
            print(f"Warning: No attributes found for network {network_id}.")
            attributes_dict = {}

        # 4f. Assemble the final object for this network
        final_network_object = {
            "id": int(network_id),  # The top-level ID for this network
            "attributes": attributes_dict,
            "network": d3_network_data,
        }

        # 4g. Append this complete network object to our main list
        all_networks_list.append(final_network_object)
        print(f"Network {network_id} has been processed and added to the list.")

print("\n--- All networks have been processed. ---")

# %%
# STEP 5: Write the complete list of networks to a single JSON file

print(f"\nStep 5: Writing all {len(all_networks_list)} networks to a single file...")

with open(OUTPUT_FILE, "w") as f:
    # Use indent=2 for a nicely formatted, human-readable JSON file
    json.dump(all_networks_list, f, indent=2)

print(f"Successfully created the consolidated file: {OUTPUT_FILE}")
