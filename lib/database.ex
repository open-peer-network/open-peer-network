defmodule ElixirWebsocket.Database do
  use GenServer
  @graph ElixirWebsocket.Caylir
  @proc_name :database
  require Logger

  # @query_one File.read!("lib/queries/get_one.js")

  defp via(id) do
    {:via, Registry, {Registry.ElixirWebsocket, id}}
  end

  def start_link(_) do
    GenServer.start_link(__MODULE__, [@proc_name], name: via(@proc_name))
  end

  def write(payload) do
    GenServer.cast(via(@proc_name), {:incoming_message, payload})
  end

  @impl true
  def init(state) do
    {:ok, state}
  end

  @impl true
  def handle_cast({:incoming_message, payload}, state) do
    Logger.info "incoming_message: #{inspect(payload)}"

    case payload do
      [s, p, o] ->
        resp = @graph.write(%{ subject: s, predicate: p, object: o })
        Logger.info inspect(resp)

      [s, p, o, l] ->
        resp = @graph.write(%{ subject: s, predicate: p, object: o, label: l })
        Logger.info inspect(resp)
    end

    {:noreply, [payload | state]}
  end
end
