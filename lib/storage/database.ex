defmodule ElixirWebsocket.Database do
  use Phoenix.Endpoint, otp_app: :elixir_websocket
  alias ElixirWebsocket.Caylir

  def query(%{"s" => subj, "p" => pred}) do
    Caylir.query(~s"""
      var result = {};
      var user = g.V(#{Jason.encode!(subj)});
      var predicates = #{Jason.encode!(pred)};

      predicates.map(function(predicate) {
        result[predicate] = user.out(predicate).toValue();
      });

      g.emit(result);
    """)
    |> (fn
          [data] -> %{subject: subj, data: data}
          resp -> IO.puts("query failed miserably: #{inspect(resp)}")
        end).()
  end

  def write(s, p, o) when is_binary(s) and is_binary(p) and is_binary(o) do
    existing_entry =
      "g.emit(g.V(#{Jason.encode!(s)}).out(#{Jason.encode!(p)}).toValue())"
      |> Caylir.query()

    if existing_entry do
      status =
        Caylir.delete(%{
          "subject" => s,
          "predicate" => p,
          "object" => Enum.at(existing_entry, 0)
        })

      if status == :ok do
        Caylir.write(%{"subject" => s, "predicate" => p, "object" => o})
      end
    else
      Caylir.write(%{"subject" => s, "predicate" => p, "object" => o})
    end
  end
end
