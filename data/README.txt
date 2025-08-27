Research 2: Audits using Synthetic Networks

There are 4840 generated networks, each network has 100 nodes. 

-------------
nodes_pg.csv -- the class of each node for each network.

id: network id.
node: node id.
minority: indicator for minority (1: minority, 0: majority).
pagerank: pageRank value.
order_rank: the order by rank (sorted by pagerank, the nodes with the same pagerank are given the same rank).
order_node: the order by node (sorted by pagerank).

-------------
edges.csv -- the directed edges for each network.

id: network id.
source: source node id.
target: target node id.

-------------
ranking_minorities.csv -- inequality and inequity attributes.

id: network id.
d: edge density (values: 0.01, 0.1).
plo_m: activity of minority (values: 1.5, 3.0).
plo_M: activity of majority (values: 1.5, 3.0).
fm: percentage of minorities in the network (values: 0.1, 0.2, 0.3, 0.4, 0.5).
fm_node: percentage of minorities at top-k, based on order_node.
fm_rank: percentage of minorities at top-k, based on order_rank.
h_mm: homophily within the minority group (values: 0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0).
h_MM: homophily within the majority group (values: 0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0).
k: top-k in % (values: 5%, 10%, 20%, …, 100%).
me_rank: mean error (inequity) based on order_rank.
me_node: mean error (inequity) based on order_node.
gini_rank: gini (inequality) based on order_rank.
gini_node: gini (inequality) based on order_node.
gini: the global gini.

Inequity label: 
If me >= -0.05 and me <=0.05 then fair
If me < -0.05 then under-represented
If me > -0.05 then over-represented

Inequality label: 
If gini >= 0.3 and gini < 0.6 then moderate
If gini < 0.3 then equality
If gini >= 0.6 then skewed

