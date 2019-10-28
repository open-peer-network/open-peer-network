defmodule ElixirWebsocket.Database do
  use GenServer
  alias ElixirWebsocket.Caylir
  require Logger

  @proc_name :database
  # @query_one File.read!("lib/queries/get_one.js")

  defp via(id) do
    {:via, Registry, {Registry.ElixirWebsocket, id}}
  end

  def start_link(_) do
    GenServer.start_link(__MODULE__, [@proc_name], name: via(@proc_name))
  end

  @impl true
  def init(state) do
    {:ok, state}
  end

  def run(action, payload) do
    if is_list(payload) && length(payload) in [3,4] do
      if action in ["set", "update", "delete"] do
        GenServer.cast(via(@proc_name), {action, payload})
        Jason.encode!(payload)
      else
        "invalid action: #{inspect(action)}"
      end
    else
      "invalid payload: #{inspect(payload)}"
    end
  end

  @impl true
  def handle_cast({action, payload}, state) do
    Logger.info "incoming_message: #{inspect(payload)}"

    message = commit(action, repackage(payload))
    Logger.info inspect(message)

    {:noreply, [payload | state]}
  end

  defp repackage([s, p, o]) do
    %{ subject: s, predicate: p, object: o }
  end

  defp repackage([s, p, o, l]) do
    %{ subject: s, predicate: p, object: o, label: l }
  end

  defp commit(action, data) do
    case action do
      "set" ->
        Caylir.write(data)
      "delete" ->
        Caylir.delete(data)
      "update" ->
        Caylir.delete(data)
        Caylir.write(data)
    end
  end
end
