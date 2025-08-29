import csv
import argparse
import json
import os


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

    # Read network-level attributes from ranking_minorities.csv
    network_attributes = None
    ranking_file = nodes_file.replace("nodes_pg.csv", "ranking_minorities.csv")
    try:
        with open(ranking_file, newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if str(row["id"]) == str(network_id):
                    network_attributes = {
                        key: float(row[key]) if key not in ["id", "k"] else row[key]
                        for key in row
                    }
                    break
    except Exception:
        network_attributes = None

    result = {"nodes": nodes, "links": links}
    if network_attributes:
        result["network_attributes"] = network_attributes
    return result


def batch_generate_graphs(nodes_file, edges_file, output_dir, start_id=0, end_id=0):
    os.makedirs(output_dir, exist_ok=True)
    for network_id in range(start_id, end_id + 1):
        graph = convert_to_graph(nodes_file, edges_file, network_id)
        output_path = os.path.join(output_dir, f"graph_{network_id}.json")
        with open(output_path, "w") as f:
            json.dump(graph, f, indent=2)
    print(f"Generated graphs for IDs {start_id} to {end_id} in {output_dir}")


def main():
    parser = argparse.ArgumentParser(
        description="Convert nodes and edges CSVs to D3 graph JSON."
    )
    parser.add_argument("--nodes", required=True, help="Path to nodes CSV file")
    parser.add_argument("--edges", required=True, help="Path to edges CSV file")
    parser.add_argument("--id", help="Network id to filter")
    parser.add_argument("--output", help="Output JSON file (optional)")
    parser.add_argument(
        "--batch",
        action="store_true",
        help="Batch mode: generate for a range of IDs",
    )
    parser.add_argument(
        "--start_id",
        type=int,
        help="Start network id (for batch mode)",
    )
    parser.add_argument("--end_id", type=int, help="End network id (for batch mode)")
    parser.add_argument("--output_dir", help="Output directory for batch mode")
    args = parser.parse_args()

    if args.batch:
        if args.start_id is None or args.end_id is None or args.output_dir is None:
            print("Batch mode requires --start_id, --end_id, and --output_dir")
        else:
            batch_generate_graphs(
                args.nodes, args.edges, args.output_dir, args.start_id, args.end_id
            )
    else:
        if args.id is None:
            print("Please provide --id for single network mode.")
        else:
            graph = convert_to_graph(args.nodes, args.edges, args.id)
            if args.output:
                with open(args.output, "w") as f:
                    json.dump(graph, f, indent=2)
            else:
                print(json.dumps(graph, indent=2))


if __name__ == "__main__":
    main()
