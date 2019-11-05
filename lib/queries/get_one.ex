defmodule ElixirWebsocketWeb.Queries do

  def run(%{ "s" => id}) do
    ~s"""
      var result = {};
      var user = g.V('#{id}');

      user.outPredicates().map(function (d) {
        result[d.id] = user.out(d.id).toValue();
      });

      g.emit(result);
    """
  end

  def run(_) do
    {:error, "No query match"}
  end
end
