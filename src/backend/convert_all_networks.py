import csv
import argparse
import json
import os


# --- Fixed paths ---
PARAMS_FILE = "data/processed_data/parameters.csv"
NODES_FILE = "data/raw_data/nodes_pg.csv"
EDGES_FILE = "data/raw_data/edges.csv"
OUTPUT_DIR = "data/network_generated"


def convert_to_graph_first_draft(nodes_file, edges_file, network_id):
    nodes = []
    links = []

    # Read nodes
    with open(nodes_file, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if str(row["id"]) == str(network_id):
                nodes.append({"id": int(row["node"]), "name": row["node"]})

    # Read edges
    with open(edges_file, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if str(row["id"]) == str(network_id):
                links.append(
                    {"source": int(row["source"]), "target": int(row["target"])}
                )

    return {"nodes": nodes, "links": links}


def try_float(val):
    try:
        return float(val)
    except ValueError:
        return val


def convert_to_graph(nodes_file, edges_file, network_id):
    nodes = []
    links = []

    # Read nodes with extra properties
    with open(nodes_file, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if str(row["id"]) == str(network_id):
                nodes.append(
                    {
                        "id": int(row["node"]),
                        "name": row["node"],
                        "minority": int(row["minority"]),
                        "pagerank": float(row["pagerank"]),
                        "order_rank": int(row["order_rank"]),
                        "order_node": int(row["order_node"]),
                    }
                )

    # Read edges
    with open(edges_file, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if str(row["id"]) == str(network_id):
                links.append(
                    {"source": int(row["source"]), "target": int(row["target"])}
                )

    return {"nodes": nodes, "links": links}


def batch_generate_graphs(nodes_file, edges_file, params_file, output_dir):
    os.makedirs(output_dir, exist_ok=True)

    with open(params_file, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            network_id = row["id"]
            graph = convert_to_graph(nodes_file, edges_file, network_id)

            # Build filename from parameters (scaled ×10)
            fm = int(float(row["fm"]) * 10)
            h_MM = int(float(row["h_MM"]) * 10)
            h_mm = int(float(row["h_mm"]) * 10)
            filename = f"graph_fm{fm}_hMM{h_MM}_hmm{h_mm}.json"  # Heatmap_fm0.1_hMM0.2_hmm0.5.jpg

            output_path = os.path.join(output_dir, filename)
            with open(output_path, "w") as out:
                json.dump(graph, out, indent=2)

    print(f"✅ Generated graphs in {output_dir}")


def main():
    parser = argparse.ArgumentParser(description="Convert networks into JSON graphs.")
    parser.add_argument("--batch", action="store_true", help="Generate all networks")
    parser.add_argument("--id", help="Single network id (optional)")
    parser.add_argument(
        "--output_dir",
        default=OUTPUT_DIR,
        help="Where to save generated JSON files",
    )
    args = parser.parse_args()

    if args.batch:
        batch_generate_graphs(NODES_FILE, EDGES_FILE, PARAMS_FILE, args.output_dir)
    else:
        if args.id is None:
            print("Please provide --id for single mode or use --batch.")
            return

        graph = convert_to_graph(NODES_FILE, EDGES_FILE, args.id)

        # Lookup params for filename
        with open(PARAMS_FILE, newline="") as f:
            reader = csv.DictReader(f)
            row = next((r for r in reader if r["id"] == str(args.id)), None)

        if row:
            fm = int(float(row["fm"]) * 10)
            h_MM = int(float(row["h_MM"]) * 10)
            h_mm = int(float(row["h_mm"]) * 10)
            filename = f"graph_fm{fm}_hMM{h_MM}_hmm{h_mm}.json"  # Heatmap_fm0.1_hMM0.2_hmm0.5.jpg

        else:
            filename = f"graph_fm{fm}_hMM{h_MM}_hmm{h_mm}.json"  # Heatmap_fm0.1_hMM0.2_hmm0.5.jpg

        output_path = os.path.join(args.output_dir, filename)
        os.makedirs(args.output_dir, exist_ok=True)
        with open(output_path, "w") as out:
            json.dump(graph, out, indent=2)

        print(f"✅ Saved single graph to {output_path}")


if __name__ == "__main__":
    main()
