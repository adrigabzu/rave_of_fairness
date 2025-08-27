
# %%
import pandas as pd
import os

os.getcwd() 

# %%

# Read the CSV file
data = pd.read_csv("../data/raw_data/ranking_minorities.csv")

# %%

# Filter rows where k equals 10
filtered_data = data[data['k'] == 10]

# Save the filtered data to CSV
filtered_data.to_csv("../data/processed_data/parameters.csv", index=False)

# Save the filtered data to JSON
filtered_data.to_json("../data/processed_data/parameters.json", orient="records", lines=True)


# %%
