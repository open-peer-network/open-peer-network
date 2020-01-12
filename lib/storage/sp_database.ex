defmodule OPN.SPDatabase do
  use GenServer

  alias OPN.Caylir

  @db_load_delay 1 * 1000

  @all_subjects ~s"""
  g.V().in().all();
  """
  @all_predicates ~s"""
  g.V("##subject##").outPredicates().all();
  """
  @all_objects ~s"""
  g.V("##subject##").out("##predicate##").all();
  """

  def start_link(_) do
    GenServer.start_link(__MODULE__, nil, name: __MODULE__)
  end

  def init(init_arg) do
    :ets.new(:sp, [:set, :public, :named_table])
    Process.send_after(self(), :load_data, @db_load_delay)
    {:ok, init_arg}
  end

  def handle_info(:load_data, state) do
    IO.puts("Loading...")
    load_all()

    {:noreply, state}
  end

  defp load_all() do
    @all_subjects
    |> Caylir.query()
    |> Enum.uniq()
    |> Enum.map(fn e ->
      subject = Map.get(e, "id") |> IO.inspect(label: "subject")

      predicates =
        @all_predicates
        |> String.replace("##subject##", "#{subject}")
        |> Caylir.query()
        |> IO.inspect(label: "predicates")

      Enum.map(predicates, fn pm ->
        predicate = Map.get(pm, "id")

        object =
          @all_objects
          |> String.replace(
            ~r/##subject##|##predicate##/,
            fn s ->
              case s do
                "##subject##" -> "#{subject}"
                "##predicate##" -> "#{predicate}"
              end
            end
          )
          |> Caylir.query()
          |> List.first()
          |> Map.get("id")

        IO.inspect("#{subject}:#{predicate}", label: "s:p")
        IO.inspect("#{object}", label: "o")
        :ets.insert(:sp, {"#{subject}:#{predicate}", object})
      end)
    end)
  end
end
