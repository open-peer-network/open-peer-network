defmodule ElixirWebsocket.Database do
  use Phoenix.Endpoint, otp_app: :elixir_websocket
  alias ElixirWebsocket.Caylir

  defp spo(s, p, o), do: %{"subject" => s, "predicate" => p, "object" => o}

  def query(%{"s" => subj, "p" => pred}) do
    case Caylir.query(~s"""
      var result = {};
      var user = g.V(#{Jason.encode!(subj)});
      var predicates = #{Jason.encode!(pred)};

      predicates.map(function(predicate) {
        result[predicate] = user.out(predicate).toValue();
      });

      g.emit(result);
    """) do
      [data] -> %{subject: subj, data: data}
      resp -> IO.puts("query failed miserably: #{inspect(resp)}")
    end
  end

  def write(s, p, o) when is_binary(s) and is_binary(p) and is_binary(o) do
    "g.emit(g.V(#{Jason.encode!(s)}).out(#{Jason.encode!(p)}).toValue())"
    |> Caylir.query()
    |> object_from_query()
    |> delete_entry(s, p)
    |> write_new(s, p, o)
  end

  defp object_from_query(obj) do
    if is_list(obj), do: Enum.at(obj, 0), else: :none
  end

  defp delete_entry(o, s, p) do
    if is_binary(o), do: Caylir.delete(spo(s, p, o)), else: :ok
  end

  defp write_new(:ok, s, p, o) do
    Caylir.write(spo(s, p, o))
  end
end
