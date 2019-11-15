defmodule ElixirWebsocket.Database do
  use Phoenix.Endpoint, otp_app: :elixir_websocket
  alias ElixirWebsocket.Caylir

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
    |> clear(s, p)
    |> write_new(s, p, o)
  end

  defp clear(existing, s, p) do
    if existing do
      Caylir.delete(%{
        "subject" => s,
        "predicate" => p,
        "object" => Enum.at(existing, 0)
      })
    else
      :ok
    end
  end

  defp write_new(status, s, p, o) do
    case status do
      :ok -> Caylir.write(%{"subject" => s, "predicate" => p, "object" => o})
      _ -> IO.puts("Error: delete failed [subject, predicate]: [#{inspect(s)}, #{inspect(p)}]")
    end
  end
end
