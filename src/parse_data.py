# %%
import pandas as pd
import os
import matplotlib.pyplot as plt
import numpy as np

os.getcwd()
# Read the CSV file
data = pd.read_csv("../data/raw_data/ranking_minorities.csv")

# %%

# Filter rows where k equals 10

filtered = data[
    (data["k"] == 10)
    & (data["h_mm"].isin([0.2, 0.5, 0.8]))
    & (data["h_MM"].isin([0.2, 0.5, 0.8]))
    & (data["fm"].isin([0.1, 0.3]))
    & (data["plo_m"] == 3.0)
    & (data["plo_M"] == 3.0)
    & (data["d"] == 0.1)
]
# %%
# Select specific columns

selected_columns = ["id", "h_mm", "h_MM", "fm", "me_node"]
filtered_data = filtered[selected_columns]


# Generate summary statistics
summary_stats = filtered_data.describe()
print("Summary Statistics:")
print(summary_stats)


# Create a histogram for 'me_node'
def plot_histogram(data, bins=5):

    plt.hist(data["me_node"], bins=bins, edgecolor="black", alpha=0.7)
    plt.title("Histogram of me_node")
    plt.xlabel("me_node")
    plt.ylabel("Frequency")
    plt.grid(axis="y", linestyle="--", alpha=0.7)
    plt.show()


# %%
# --- Create Bins Centered on 0 and Plot ---

# 1. Find the maximum absolute value to create a symmetric range

max_abs_val = filtered_data["me_node"].abs().max()

# 2. Create 6 bin edges to define 5 symmetric bins
bin_edges = np.linspace(-max_abs_val, max_abs_val, 6)

print("\nBin edges centered on 0:")
print(bin_edges)

# 3. Plot histogram with custom bins centered around 0
plot_histogram(filtered_data, bins=bin_edges)


# %%
# --- Add the bins as a new column in the DataFrame ---

filtered_data["me_node_bin"] = pd.cut(
    filtered_data["me_node"], bins=bin_edges, include_lowest=True

)

# %%
# --- Calculate and add the midpoint of each bin ---

# 1. Get the unique interval categories from the binned column
intervals = filtered_data["me_node_bin"].cat.categories

# 2. Calculate the midpoint for each interval and round it
midpoints = (intervals.left + intervals.right) / 2


# 3. Create a mapping from the interval object to its calculated midpoint
midpoint_map = dict(zip(intervals, midpoints))

# 4. Map the values to create the new column
filtered_data["me_node_bin_value"] = (
    filtered_data["me_node_bin"].map(midpoint_map).astype(np.float32).round(2)
)

# Display the relevant columns to verify the result
print("\nDataFrame with bin midpoints:")
print(filtered_data[["me_node", "me_node_bin", "me_node_bin_value"]].head(10))


# %%
# Save the filtered data to CSV
# The new 'me_node_bin_value' column will now be included
filtered_data.to_csv("../data/processed_data/parameters.csv", index=False)

# Save the filtered data to JSON
filtered_data.to_json(
    "../data/processed_data/parameters.json", orient="records", lines=True
)
