import plotly.graph_objects as go

# Data from the provided JSON
years = ["2025", "2026", "2027"]
revenues = [540000, 1800000, 4500000]
costs = [692000, 732000, 582000]
profit = [-152000, 1068000, 3918000]

# Create grouped bar chart
fig = go.Figure()

# Add revenue bars (using light green color)
fig.add_trace(go.Bar(
    name='Revenus',
    x=years,
    y=revenues,
    marker_color='#ECEBD5',
    cliponaxis=False
))

# Add cost bars (using red color) 
fig.add_trace(go.Bar(
    name='Coûts',
    x=years,
    y=costs,
    marker_color='#B4413C',
    cliponaxis=False
))

# Add profit bars (using cyan color)
fig.add_trace(go.Bar(
    name='Profit Net',
    x=years,
    y=profit,
    marker_color='#1FB8CD',
    cliponaxis=False
))

# Update layout
fig.update_layout(
    title='Projection Financière SOCaaS - 3 Ans',
    xaxis_title='Années',
    yaxis_title='Montant €',
    barmode='group',
    legend=dict(orientation='h', yanchor='bottom', y=1.05, xanchor='center', x=0.5)
)

# Format y-axis to show values in abbreviated format
fig.update_yaxes(tickformat='.2s')

# Save the chart
fig.write_image("socaas_financial_projection.png")